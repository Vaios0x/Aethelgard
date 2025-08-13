import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { ethers } from 'ethers';

const app = express();
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',');
app.use(cors({ origin: CORS_ORIGINS, credentials: false }));
app.use(bodyParser.json());
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));

const NONCES = new Map(); // addr -> { nonce, exp }
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const CORE_RPC = process.env.CORE_TESTNET2_RPC || 'https://rpc.test2.btcs.network';
const provider = new ethers.JsonRpcProvider(CORE_RPC);

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
    const accessToken = jwt.sign({ sub: addr }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ accessToken, walletAddress: addr });
  } catch (e) {
    res.status(400).json({ error: 'verificación SIWE falló' });
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
  const res = await fetch(url);
  return await res.json();
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
        } catch { meta = {}; }
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
    res.status(500).json({ error: 'no se pudo cargar héroes' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SIWE backend en http://localhost:${PORT}`));


