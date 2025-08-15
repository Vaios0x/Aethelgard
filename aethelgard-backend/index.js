import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';
import * as Sentry from '@sentry/node';

// Logger mínimo
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();
function log(level, ...args) {
  if (LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL]) {
    const ts = new Date().toISOString();
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](`[${ts}] [${level.toUpperCase()}]`, ...args);
  }
}

const app = express();
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 1.0 });
  app.use(Sentry.Handlers.requestHandler());
}
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
const corsOptions = CORS_ORIGINS.length ? { origin: CORS_ORIGINS, credentials: false } : { origin: true, credentials: false };
app.use(cors(corsOptions));
// Preflight universal
app.options('*', cors(corsOptions));
app.use(bodyParser.json());
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
// Logging de requests básico
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    log('info', `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

const NONCES = new Map(); // addr -> { nonce, exp }
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_TTL = Number(process.env.ACCESS_TTL_SEC || 3600); // 1h
const REFRESH_TTL_SEC = Number(process.env.REFRESH_TTL_SEC || 60 * 60 * 24 * 30); // 30d
const CORE_RPC = process.env.CORE_TESTNET2_RPC || 'https://rpc.test2.btcs.network';
const provider = new ethers.JsonRpcProvider(CORE_RPC);

// Importar sistema de caché enterprise
const { cacheManager, HeroCache, MarketplaceCache, StatsCache, EssenceCache } = require('./src/cache/cacheManager');
const { BlockchainEventCache } = require('./src/cache/blockchainEventCache');
const { CacheController } = require('./src/cache/cacheController');

// Inicializar sistema de caché
const blockchainEventCache = new BlockchainEventCache(provider);
const cacheController = new CacheController(blockchainEventCache);

// Iniciar procesamiento de eventos blockchain (opcional)
if (process.env.ENABLE_BLOCKCHAIN_EVENTS === 'true') {
  blockchainEventCache.startProcessing().catch(console.error);
}

function genNonce() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

app.get('/auth/nonce/:address', (req, res) => {
  const { address } = req.params;
  if (!address) return res.status(400).json({ error: 'address requerido' });
  const nonce = genNonce();
  NONCES.set(address.toLowerCase(), { nonce, exp: Date.now() + 5 * 60_000 }); // 5 minutos
  res.json({ nonce, ttlMs: 5 * 60_000 });
});

app.post('/auth/login', async (req, res) => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) return res.status(400).json({ error: 'faltan campos' });
    const siwe = new SiweMessage(message);
    const fields = await siwe.verify({ signature });
    const addr = fields.data.address.toLowerCase();
    const rec = NONCES.get(addr);
    if (!rec || rec.nonce !== fields.data.nonce) return res.status(400).json({ error: 'nonce inválido' });
    if (rec.exp < Date.now()) return res.status(400).json({ error: 'nonce expirado' });
    NONCES.delete(addr); // evitar replay
    const accessToken = jwt.sign({ sub: addr, typ: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TTL });
    const refreshToken = jwt.sign({ sub: addr, typ: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TTL_SEC });
    res.json({ accessToken, refreshToken, walletAddress: addr, expiresIn: ACCESS_TTL });
  } catch (e) {
    res.status(400).json({ error: 'verificación SIWE falló' });
  }
});

// Healthcheck para Render
app.get('/healthz', (req, res) => {
  res.json({ ok: true });
});

// Refresh token → nuevo access token
app.post('/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: 'faltan campos' });
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    if (payload?.typ !== 'refresh') return res.status(400).json({ error: 'token inválido' });
    const accessToken = jwt.sign({ sub: payload.sub, typ: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TTL });
    res.json({ accessToken, expiresIn: ACCESS_TTL });
  } catch (e) {
    res.status(401).json({ error: 'refresh inválido' });
  }
});

// Middleware simple de auth
function auth(req, res, next) {
  const authz = req.headers.authorization || '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'no token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { address: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: 'token inválido' });
  }
}

// Función mejorada para fetch de metadata con caché
async function fetchJson(url) {
  // Verificar caché primero
  const cached = await HeroCache.getMetadata(url);
  if (cached) {
    return cached;
  }

  const gateways = [
    url,
    url?.startsWith('http') ? url : null,
  ].filter(Boolean);
  
  // Fallbacks de gateway IPFS
  if (url?.startsWith('ipfs://')) {
    const path = url.replace('ipfs://', '');
    gateways.unshift(
      `https://ipfs.io/ipfs/${path}`,
      `https://cloudflare-ipfs.com/ipfs/${path}`,
      `https://gateway.pinata.cloud/ipfs/${path}`
    );
  }
  
  let lastErr;
  for (const g of gateways) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7_000);
      const res = await fetch(g, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const data = await res.json();
      
      // Guardar en caché
      await HeroCache.setMetadata(url, data);
      return data;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('metadata fetch failed');
}
function ipfsToHttp(uri) {
  if (!uri) return uri;
  return uri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${uri.replace('ipfs://', '')}` : uri;
}

// GET /users/me
app.get('/users/me', auth, async (req, res) => {
  res.json({ walletAddress: req.user.address });
});

// GET /users/me/heroes
app.get('/users/me/heroes', auth, async (req, res) => {
  try {
    const HERO_ADDR = process.env.HERO_NFT_ADDR;
    if (!HERO_ADDR) return res.status(500).json({ error: 'HERO_NFT_ADDR no configurado' });

    const abi = [
      'function balanceOf(address) view returns (uint256)',
      'function tokenOfOwnerByIndex(address,uint256) view returns (uint256)',
      'function tokenURI(uint256) view returns (string)',
      'function levelOf(uint256) view returns (uint256)'
    ];
    const contract = new ethers.Contract(HERO_ADDR, abi, provider);
    const balance = await contract.balanceOf(req.user.address);
    const ids = [];
    for (let i = 0n; i < balance; i++) {
      ids.push(await contract.tokenOfOwnerByIndex(req.user.address, i));
    }
    const heroes = [];
    for (const id of ids) {
      const uri = await contract.tokenURI(id);
      const url = ipfsToHttp(uri);
      let meta = METADATA_CACHE.get(url);
      if (!meta) {
        try {
          meta = await fetchJson(url);
          METADATA_CACHE.set(url, meta);
        } catch (e) { meta = {}; log('warn', 'metadata fetch failed', e?.message); }
      }
      heroes.push({
        id: id.toString(),
        name: meta?.name || `Héroe #${id}`,
        image: meta?.image ? ipfsToHttp(meta.image) : '',
        level: Number(await contract.levelOf(id)),
        class: meta?.class || 'Warrior',
        power: Number(meta?.power || 0),
        description: meta?.description || ''
      });
    }
    res.json({ heroes });
  } catch (e) {
    log('error', 'heroes endpoint failed', e?.message);
    res.status(500).json({ error: 'no se pudo cargar héroes' });
  }
});

// GET /users/me/essence-balance
app.get('/users/me/essence-balance', auth, async (req, res) => {
  try {
    // Verificar caché primero
    const cached = await EssenceCache.getBalance(req.user.address);
    if (cached) {
      return res.json(cached);
    }

    const ESSENCE_ADDR = process.env.ESSENCE_TOKEN_ADDR;
    if (!ESSENCE_ADDR) return res.status(500).json({ error: 'ESSENCE_TOKEN_ADDR no configurado' });

    const abi = [
      'function balanceOf(address) view returns (uint256)',
      'function getTokenStats() view returns (uint256, uint256, uint256, uint256)'
    ];
    const contract = new ethers.Contract(ESSENCE_ADDR, abi, provider);
    
    const [balance, tokenStats] = await Promise.all([
      contract.balanceOf(req.user.address),
      contract.getTokenStats()
    ]);

    const [totalSupply, maxSupply, remainingSupply, rewardAmount] = tokenStats;

    const response = {
      balance: balance.toString(),
      balanceFormatted: Number(ethers.formatEther(balance)),
      tokenStats: {
        totalSupply: totalSupply.toString(),
        maxSupply: maxSupply.toString(),
        remainingSupply: remainingSupply.toString(),
        rewardAmount: rewardAmount.toString()
      }
    };

    // Guardar en caché
    await EssenceCache.setBalance(req.user.address, response);

    res.json(response);
  } catch (e) {
    log('error', 'essence balance endpoint failed', e?.message);
    res.status(500).json({ error: 'no se pudo cargar balance de esencia' });
  }
});

// GET /users/me/stats
app.get('/users/me/stats', auth, async (req, res) => {
  try {
    // Verificar caché primero
    const cached = await StatsCache.getUserStats(req.user.address);
    if (cached) {
      return res.json(cached);
    }
    const HERO_ADDR = process.env.HERO_NFT_ADDR;
    const STAKING_ADDR = process.env.STAKING_CONTRACT_ADDR;
    const ESSENCE_ADDR = process.env.ESSENCE_TOKEN_ADDR;
    const MARKET_ADDR = process.env.MARKETPLACE_ADDR;

    if (!HERO_ADDR) return res.status(500).json({ error: 'HERO_NFT_ADDR no configurado' });

    // ABIs necesarios
    const heroAbi = [
      'function balanceOf(address) view returns (uint256)',
      'function tokenOfOwnerByIndex(address,uint256) view returns (uint256)',
      'function levelOf(uint256) view returns (uint256)'
    ];

    const stakingAbi = [
      'function getStakedTokens(address) view returns (uint256[])',
      'function pendingRewards(address) view returns (uint256)',
      'function getUserStakingInfo(address) view returns (uint256[], uint256, uint256, uint256)'
    ];

    const essenceAbi = [
      'function balanceOf(address) view returns (uint256)'
    ];

    const marketAbi = [
      'function listings(bytes32) view returns (address, address, uint256, uint256, bool)'
    ];

    const hero = new ethers.Contract(HERO_ADDR, heroAbi, provider);
    const staking = STAKING_ADDR ? new ethers.Contract(STAKING_ADDR, stakingAbi, provider) : null;
    const essence = ESSENCE_ADDR ? new ethers.Contract(ESSENCE_ADDR, essenceAbi, provider) : null;
    const market = MARKET_ADDR ? new ethers.Contract(MARKET_ADDR, marketAbi, provider) : null;

    // Obtener datos básicos
    const [heroBalance, essenceBalance] = await Promise.all([
      hero.balanceOf(req.user.address),
      essence ? essence.balanceOf(req.user.address) : 0n
    ]);

    // Obtener héroes del usuario
    const heroIds = [];
    for (let i = 0n; i < heroBalance; i++) {
      heroIds.push(await hero.tokenOfOwnerByIndex(req.user.address, i));
    }

    // Obtener niveles de héroes
    const heroLevels = await Promise.all(
      heroIds.map(id => hero.levelOf(id))
    );

    // Obtener información de staking
    let stakingInfo = null;
    if (staking) {
      try {
        const [stakedTokens, pendingRewards, userInfo] = await Promise.all([
          staking.getStakedTokens(req.user.address),
          staking.pendingRewards(req.user.address),
          staking.getUserStakingInfo(req.user.address)
        ]);

        stakingInfo = {
          stakedTokens: stakedTokens.map(t => t.toString()),
          pendingRewards: pendingRewards.toString(),
          pendingRewardsFormatted: Number(ethers.formatEther(pendingRewards)),
          totalRewards: userInfo[1].toString(),
          lastClaimTime: Number(userInfo[2]),
          stakedCount: stakedTokens.length
        };
      } catch (e) {
        log('warn', 'staking info failed', e?.message);
      }
    }

    // Obtener listados del usuario en marketplace
    let marketplaceInfo = null;
    if (market) {
      try {
        // Buscar listados del usuario (esto requeriría eventos, pero por simplicidad usamos un enfoque básico)
        marketplaceInfo = {
          activeListings: 0, // En una implementación real, contarías los eventos Listed
          totalListed: 0
        };
      } catch (e) {
        log('warn', 'marketplace info failed', e?.message);
      }
    }

    // Calcular estadísticas
    const totalPower = heroLevels.reduce((sum, level) => sum + Number(level), 0);
    const averageLevel = heroLevels.length > 0 ? totalPower / heroLevels.length : 0;
    const maxLevel = heroLevels.length > 0 ? Math.max(...heroLevels.map(l => Number(l))) : 0;

    // Agrupar héroes por nivel
    const heroesByLevel = {};
    heroLevels.forEach(level => {
      const levelNum = Number(level);
      heroesByLevel[levelNum] = (heroesByLevel[levelNum] || 0) + 1;
    });

    const response = {
      user: {
        address: req.user.address,
        totalHeroes: Number(heroBalance),
        totalPower,
        averageLevel: Math.round(averageLevel * 100) / 100,
        maxLevel,
        heroesByLevel
      },
      essence: {
        balance: essenceBalance.toString(),
        balanceFormatted: Number(ethers.formatEther(essenceBalance))
      },
      staking: stakingInfo,
      marketplace: marketplaceInfo,
      summary: {
        totalAssets: Number(heroBalance) + (stakingInfo?.stakedCount || 0),
        totalValue: Number(ethers.formatEther(essenceBalance)),
        isActive: Number(heroBalance) > 0 || (stakingInfo?.stakedCount || 0) > 0
      }
    };

    // Guardar en caché
    await StatsCache.setUserStats(req.user.address, response);

    res.json(response);
  } catch (e) {
    log('error', 'user stats endpoint failed', e?.message);
    res.status(500).json({ error: 'no se pudo cargar estadísticas del usuario' });
  }
});

// GET /users/me/activity
app.get('/users/me/activity', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, from, to } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // En una implementación real, esto vendría de una base de datos
    // Por ahora, simulamos actividad basada en eventos de blockchain
    const HERO_ADDR = process.env.HERO_NFT_ADDR;
    const STAKING_ADDR = process.env.STAKING_CONTRACT_ADDR;
    const MARKET_ADDR = process.env.MARKETPLACE_ADDR;

    if (!HERO_ADDR) return res.status(500).json({ error: 'HERO_NFT_ADDR no configurado' });

    // ABIs para eventos
    const heroAbi = [
      'event HeroEvolved(uint256 indexed tokenId, address indexed owner, uint256 newEvolutionStage)',
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
    ];

    const stakingAbi = [
      'event Staked(address indexed user, uint256[] tokenIds)',
      'event Unstaked(address indexed user, uint256[] tokenIds)',
      'event Claimed(address indexed user, uint256 amount)'
    ];

    const marketAbi = [
      'event Listed(address indexed seller, address indexed nft, uint256 indexed tokenId, uint256 price)',
      'event Bought(address indexed buyer, address indexed nft, uint256 indexed tokenId, uint256 price)',
      'event Canceled(address indexed seller, address indexed nft, uint256 indexed tokenId)'
    ];

    const hero = new ethers.Contract(HERO_ADDR, heroAbi, provider);
    const staking = STAKING_ADDR ? new ethers.Contract(STAKING_ADDR, stakingAbi, provider) : null;
    const market = MARKET_ADDR ? new ethers.Contract(MARKET_ADDR, marketAbi, provider) : null;

    const iface = new ethers.Interface([...heroAbi, ...(stakingAbi || []), ...(marketAbi || [])]);

    // Obtener eventos del usuario
    const fromBlock = Number(process.env.ACTIVITY_FROM_BLOCK || 0);
    const toBlock = 'latest';

    const events = [];

    // Eventos de evolución
    try {
      const evolutionLogs = await provider.getLogs({
        address: HERO_ADDR,
        fromBlock,
        toBlock,
        topics: [
          iface.getEvent('HeroEvolved').topicHash,
          null,
          ethers.zeroPadValue(req.user.address, 32)
        ]
      });

      for (const log of evolutionLogs) {
        const parsed = iface.parseLog(log);
        events.push({
          id: `evolution-${log.transactionHash}-${parsed.args.tokenId}`,
          type: 'evolution',
          summary: `Héroe #${parsed.args.tokenId} evolucionó a etapa ${parsed.args.newEvolutionStage}`,
          details: `Evolución exitosa`,
          timestamp: (await provider.getBlock(log.blockNumber)).timestamp * 1000,
          txHash: log.transactionHash,
          tokenId: parsed.args.tokenId.toString(),
          status: 'success',
          metadata: {
            newStage: Number(parsed.args.newEvolutionStage)
          }
        });
      }
    } catch (e) {
      log('warn', 'evolution events failed', e?.message);
    }

    // Eventos de staking
    if (staking) {
      try {
        const stakingEvents = ['Staked', 'Unstaked', 'Claimed'];
        for (const eventName of stakingEvents) {
          const logs = await provider.getLogs({
            address: STAKING_ADDR,
            fromBlock,
            toBlock,
            topics: [
              iface.getEvent(eventName).topicHash,
              ethers.zeroPadValue(req.user.address, 32)
            ]
          });

          for (const log of logs) {
            const parsed = iface.parseLog(log);
            const type = eventName.toLowerCase().replace('ed', '');
            
            events.push({
              id: `${type}-${log.transactionHash}`,
              type,
              summary: `${eventName} ${type === 'claim' ? 'recompensas' : 'héroes'}`,
              details: type === 'claim' ? 
                `Reclamadas ${ethers.formatEther(parsed.args.amount || 0)} ESSENCE` :
                `${parsed.args.tokenIds?.length || 0} héroes`,
              timestamp: (await provider.getBlock(log.blockNumber)).timestamp * 1000,
              txHash: log.transactionHash,
              status: 'success',
              metadata: {
                tokenIds: parsed.args.tokenIds?.map(t => t.toString()) || [],
                amount: parsed.args.amount?.toString()
              }
            });
          }
        }
      } catch (e) {
        log('warn', 'staking events failed', e?.message);
      }
    }

    // Eventos de marketplace
    if (market) {
      try {
        const marketEvents = ['Listed', 'Bought', 'Canceled'];
        for (const eventName of marketEvents) {
          const logs = await provider.getLogs({
            address: MARKET_ADDR,
            fromBlock,
            toBlock,
            topics: [
              iface.getEvent(eventName).topicHash,
              ethers.zeroPadValue(req.user.address, 32)
            ]
          });

          for (const log of logs) {
            const parsed = iface.parseLog(log);
            const type = eventName.toLowerCase().replace('ed', '');
            
            events.push({
              id: `${type}-${log.transactionHash}-${parsed.args.tokenId}`,
              type,
              summary: `${eventName} héroe #${parsed.args.tokenId}`,
              details: `Precio: ${ethers.formatEther(parsed.args.price || 0)} CORE`,
              timestamp: (await provider.getBlock(log.blockNumber)).timestamp * 1000,
              txHash: log.transactionHash,
              tokenId: parsed.args.tokenId.toString(),
              status: 'success',
              metadata: {
                price: parsed.args.price?.toString(),
                nft: parsed.args.nft
              }
            });
          }
        }
      } catch (e) {
        log('warn', 'marketplace events failed', e?.message);
      }
    }

    // Ordenar por timestamp (más reciente primero)
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Filtrar por tipo si se especifica
    let filteredEvents = events;
    if (type) {
      filteredEvents = events.filter(e => e.type === type);
    }

    // Filtrar por fecha si se especifica
    if (from) {
      const fromTime = new Date(from).getTime();
      filteredEvents = filteredEvents.filter(e => e.timestamp >= fromTime);
    }

    if (to) {
      const toTime = new Date(to).getTime();
      filteredEvents = filteredEvents.filter(e => e.timestamp <= toTime);
    }

    // Paginación
    const total = filteredEvents.length;
    const paginatedEvents = filteredEvents.slice(offset, offset + limitNum);

    // Calcular estadísticas
    const stats = {
      total,
      byType: {},
      byStatus: {},
      recentActivity: filteredEvents.slice(0, 5)
    };

    filteredEvents.forEach(event => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      stats.byStatus[event.status] = (stats.byStatus[event.status] || 0) + 1;
    });

    res.json({
      activities: paginatedEvents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: offset + limitNum < total,
        hasPrev: pageNum > 1
      },
      stats
    });
  } catch (e) {
    log('error', 'activity endpoint failed', e?.message);
    res.status(500).json({ error: 'no se pudo cargar historial de actividad' });
  }
});

// GET /heroes/:tokenId/metadata
app.get('/heroes/:tokenId/metadata', async (req, res) => {
  try {
    const { tokenId } = req.params;
    
    // Verificar caché primero
    const cached = await HeroCache.getHero(tokenId);
    if (cached) {
      return res.json(cached);
    }

    const HERO_ADDR = process.env.HERO_NFT_ADDR;
    if (!HERO_ADDR) return res.status(500).json({ error: 'HERO_NFT_ADDR no configurado' });

    const abi = [
      'function tokenURI(uint256) view returns (string)',
      'function levelOf(uint256) view returns (uint256)',
      'function ownerOf(uint256) view returns (address)',
      'function evolutionStageOf(uint256) view returns (uint256)'
    ];

    const contract = new ethers.Contract(HERO_ADDR, abi, provider);
    
    // Obtener datos del contrato
    const [tokenUri, level, owner, evolutionStage] = await Promise.all([
      contract.tokenURI(tokenId),
      contract.levelOf(tokenId),
      contract.ownerOf(tokenId),
      contract.evolutionStageOf(tokenId).catch(() => 1n) // Fallback si no existe
    ]);

    // Obtener metadata de IPFS
    const url = ipfsToHttp(tokenUri);
    let metadata = await HeroCache.getMetadata(url);
    if (!metadata) {
      try {
        metadata = await fetchJson(url);
      } catch (e) {
        metadata = {};
        log('warn', 'metadata fetch failed', e?.message);
      }
    }

    // Verificar si está staked
    let isStaked = false;
    const STAKING_ADDR = process.env.STAKING_CONTRACT_ADDR;
    if (STAKING_ADDR) {
      try {
        const stakingAbi = ['function isStaked(uint256) view returns (bool)'];
        const staking = new ethers.Contract(STAKING_ADDR, stakingAbi, provider);
        isStaked = await staking.isStaked(tokenId);
      } catch (e) {
        log('warn', 'staking check failed', e?.message);
      }
    }

    // Verificar si está listado en marketplace
    let isListed = false;
    let listingPrice = null;
    const MARKET_ADDR = process.env.MARKETPLACE_ADDR;
    if (MARKET_ADDR) {
      try {
        const marketAbi = [
          'function listings(bytes32) view returns (address, address, uint256, uint256, bool)'
        ];
        const market = new ethers.Contract(MARKET_ADDR, marketAbi, provider);
        const key = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address','uint256'], [HERO_ADDR, tokenId]));
        const listing = await market.listings(key);
        
        if (listing[4]) { // active
          isListed = true;
          listingPrice = {
            wei: listing[3].toString(),
            core: Number(ethers.formatEther(listing[3]))
          };
        }
      } catch (e) {
        log('warn', 'marketplace check failed', e?.message);
      }
    }

    const response = {
      tokenId: tokenId.toString(),
      name: metadata.name || `Héroe #${tokenId}`,
      description: metadata.description || '',
      image: metadata.image ? ipfsToHttp(metadata.image) : '',
      level: Number(level),
      evolutionStage: Number(evolutionStage),
      class: metadata.class || 'Warrior',
      power: Number(metadata.power || 0),
      owner: owner.toLowerCase(),
      isStaked,
      isListed,
      listingPrice,
      attributes: metadata.attributes || [],
      externalUrl: metadata.external_url,
      animationUrl: metadata.animation_url,
      background: metadata.background_color,
      createdAt: metadata.created_at,
      updatedAt: new Date().toISOString()
    };

    // Guardar en caché
    await HeroCache.setHero(tokenId, response);

    res.json(response);
  } catch (e) {
    log('error', 'hero metadata endpoint failed', e?.message);
    res.status(500).json({ error: 'no se pudo cargar metadata del héroe' });
  }
});

// Marketplace: lista activa a partir de eventos + lectura del mapping público
app.get('/market/listings', async (req, res) => {
  try {
    // Verificar caché primero
    const cached = await MarketplaceCache.getListings();
    if (cached && cached.length > 0) {
      return res.json({ listings: cached });
    }
    const MARKET_ADDR = process.env.MARKETPLACE_ADDR;
    const HERO_ADDR = process.env.HERO_NFT_ADDR;
    if (!MARKET_ADDR) return res.status(500).json({ error: 'MARKETPLACE_ADDR no configurado' });
    // ABI mínimo para eventos y getter de mapping
    const abi = [
      'event Listed(address indexed seller,address indexed nft,uint256 indexed tokenId,uint256 price)',
      'event Bought(address indexed buyer,address indexed nft,uint256 indexed tokenId,uint256 price)',
      'event Canceled(address indexed seller,address indexed nft,uint256 indexed tokenId)',
      'function listings(bytes32) view returns (address seller,address nft,uint256 tokenId,uint256 price,bool active)'
    ];
    const market = new ethers.Contract(MARKET_ADDR, abi, provider);
    const iface = new ethers.Interface(abi);
    const fromBlock = Number(process.env.MARKET_FROM_BLOCK || 0);
    const toBlock = 'latest';
    const listedLogs = await provider.getLogs({
      address: MARKET_ADDR,
      fromBlock,
      toBlock,
      topics: [iface.getEvent('Listed').topicHash],
    });
    // Para cada (nft, tokenId) listado, verifica estado actual en mapping
    const results = [];
    for (const log of listedLogs) {
      try {
        const parsed = iface.parseLog(log);
        const seller = parsed.args.seller;
        const nft = parsed.args.nft;
        const tokenId = parsed.args.tokenId;
        const key = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(['address','uint256'], [nft, tokenId]));
        const row = await market.listings(key);
        if (row.active) {
          results.push({
            id: `L-${nft}-${tokenId.toString()}`,
            nft,
            tokenId: tokenId.toString(),
            priceWei: row.price.toString(),
            priceCore: Number(ethers.formatEther(row.price)),
            seller: row.seller,
            isOwn: false,
          });
        }
      } catch {}
    }
    // Guardar en caché
    await MarketplaceCache.setListings(results);
    
    res.json({ listings: results });
  } catch (e) {
    log('error', 'listings endpoint failed', e?.message);
    // Intentar usar caché como fallback
    const fallback = await MarketplaceCache.getListings();
    if (fallback && fallback.length > 0) {
      return res.json({ listings: fallback });
    }
    res.status(500).json({ error: 'no se pudo cargar listados' });
  }
});

// Endpoints de gestión de caché
app.get('/cache/stats', (req, res) => cacheController.getCacheStats(req, res));
app.post('/cache/clear', (req, res) => cacheController.clearAllCache(req, res));
app.post('/cache/clear/:type', (req, res) => cacheController.clearCacheType(req, res));
app.post('/cache/invalidate/:type/:id', (req, res) => cacheController.invalidateCacheItem(req, res));
app.post('/cache/invalidate/pattern/:type', (req, res) => cacheController.invalidateCachePattern(req, res));
app.post('/cache/events/start', (req, res) => cacheController.startEventProcessing(req, res));
app.post('/cache/events/stop', (req, res) => cacheController.stopEventProcessing(req, res));
app.post('/cache/events/process', (req, res) => cacheController.processEventsManually(req, res));
app.post('/cache/prewarm', (req, res) => cacheController.prewarmCache(req, res));
app.get('/cache/health', (req, res) => cacheController.getCacheHealth(req, res));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => log('info', `Backend listo en :${PORT}`));
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}


