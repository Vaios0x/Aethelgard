import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors({ origin: [/^http:\/\/localhost:\d+$/], credentials: false }));
app.use(bodyParser.json());

const NONCES = new Map();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.get('/auth/nonce/:address', (req, res) => {
  const { address } = req.params;
  if (!address) return res.status(400).json({ error: 'address requerido' });
  const nonce = Math.random().toString(36).slice(2);
  NONCES.set(address.toLowerCase(), nonce);
  res.json({ nonce });
});

app.post('/auth/login', async (req, res) => {
  try {
    const { message, signature } = req.body;
    if (!message || !signature) return res.status(400).json({ error: 'faltan campos' });
    const siwe = new SiweMessage(message);
    const fields = await siwe.verify({ signature });
    const addr = fields.data.address.toLowerCase();
    const expected = NONCES.get(addr);
    if (!expected || expected !== fields.data.nonce) return res.status(400).json({ error: 'nonce inválido' });
    NONCES.delete(addr);
    const accessToken = jwt.sign({ sub: addr }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ accessToken, walletAddress: addr });
  } catch (e) {
    res.status(400).json({ error: 'verificación SIWE falló' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SIWE backend en http://localhost:${PORT}`));


