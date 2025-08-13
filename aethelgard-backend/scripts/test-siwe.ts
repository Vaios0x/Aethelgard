import 'dotenv/config';
import axios from 'axios';
import { Wallet, ethers } from 'ethers';
import { SiweMessage } from 'siwe';

async function main() {
  const priv = process.env.TEST_SIWE_PRIVATE_KEY || Wallet.createRandom().privateKey;
  const wallet = new Wallet(priv);
  const address = wallet.address;

  const baseUrl = process.env.TEST_BACKEND_URL || 'http://localhost:3000';
  const chainId = Number(process.env.TEST_CHAIN_ID || '1114');

  const nonceRes = await axios.get(`${baseUrl}/auth/nonce/${address}`);
  const nonce: string = nonceRes.data.nonce;

  const message = new SiweMessage({
    domain: 'localhost',
    address,
    statement: 'Sign in to Aethelgard',
    uri: baseUrl,
    version: '1',
    chainId,
    nonce,
  }).prepareMessage();

  const signature = await wallet.signMessage(message);
  const loginRes = await axios.post(`${baseUrl}/auth/login`, { message, signature });
  console.log('JWT:', loginRes.data.accessToken);
  console.log('Wallet:', loginRes.data.walletAddress);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


