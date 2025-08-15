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

// Caché simple para /market/listings
let LISTINGS_CACHE = { data: [], ts: 0 };
const LISTINGS_TTL_MS = Number(process.env.LISTINGS_TTL_MS || 15_000);

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

// Cache en memoria de metadata IPFS -> HTTP
const METADATA_CACHE = new Map(); // tokenURI -> json
async function fetchJson(url) {
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
      return await res.json();
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

// Marketplace: lista activa a partir de eventos + lectura del mapping público
app.get('/market/listings', async (req, res) => {
  try {
    if (Date.now() - LISTINGS_CACHE.ts < LISTINGS_TTL_MS) {
      return res.json({ listings: LISTINGS_CACHE.data });
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
    LISTINGS_CACHE = { data: results, ts: Date.now() };
    res.json({ listings: results });
  } catch (e) {
    log('error', 'listings endpoint failed', e?.message);
    if (LISTINGS_CACHE.data.length) return res.json({ listings: LISTINGS_CACHE.data });
    res.status(500).json({ error: 'no se pudo cargar listados' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => log('info', `Backend listo en :${PORT}`));
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}


