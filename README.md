## Aethelgard — Core NFT Command Center

A modern, accessible and production‑ready dApp to manage your Core‑based Hero NFTs: evolve, stake, and trade with clarity and great UX.

![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff)
![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![TailwindCSS](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=fff)
![Wagmi v2](https://img.shields.io/badge/Wagmi-000?logo=web3dotjs&logoColor=fff)
![RainbowKit](https://img.shields.io/badge/RainbowKit-0F172A?logo=rainbow&logoColor=fff)
![Viem](https://img.shields.io/badge/Viem-121212?logo=ethereum&logoColor=fff)
![Ethers v6](https://img.shields.io/badge/Ethers-253858?logo=ethereum&logoColor=fff)
![Core DAO](https://img.shields.io/badge/Core%20DAO-FF8A00?logo=bitcoin&logoColor=000)
![SIWE](https://img.shields.io/badge/SIWE-1C1C1C?logo=ethereum&logoColor=fff)

### Pitch

One command center for Core NFTs:
- Evolve heroes with safe transactions and explicit feedback.
- Stake/Unstake and claim Essence with real‑time tracking.
- Explore and list items on the Marketplace with filters, favorites and pagination.

Built keyboard‑first and accessible, with visible loading/success/error states. Native support for Core Testnet2 and Mainnet.

### Live Demo

- Frontend: link to Vercel/Netlify deployment
- Backend: Render URL (set as `VITE_BACKEND_URL` in the frontend)

### Features & Structure (Frontend)

- Routing/Layout: `src/main.tsx`, `src/App.tsx`, `components/layout/MainLayout.tsx`
- Web3: Wagmi v2 + RainbowKit, Core chains, `ensureChain`
- Auth: manual SIWE flow with nonce + JWT; `RequireAuth` for protected routes
- Modules: Dashboard, Staking (`EssenceTracker`, `StakingPanel`), Marketplace (`FilterBar`, `ListingGrid`), Activity feed
- UI: `Button`, `Card`, `Skeleton`, `Tooltip`, `ThemeToggle`, `Toaster`

### Core Integration

- Chains: Core Testnet2 (1114) and Mainnet (1116)
- RPC: `https://rpc.test2.btcs.network` (Testnet2), `https://rpc.coredao.org` (Mainnet)
- Explorer: `https://scan.test2.btcs.network`, `https://scan.coredao.org`
- `ensureChain` requests add/switch network on the wallet if needed

### Authentication (SIWE)

1. `ensureChain` to Core Testnet2/Mainnet
2. `GET /auth/nonce/:address` on backend
3. Sign `SiweMessage`
4. `POST /auth/login` → `{ accessToken, refreshToken, walletAddress }`
5. Store tokens in `localStorage`

### Deployed Addresses (Core Testnet2)

- HeroNFT: `0x5b33069977773557D07023A73468fD16F83ebaea`  
  Explorer: `https://scan.test2.btcs.network/address/0x5b33069977773557D07023A73468fD16F83ebaea`
- Staking: `0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637`  
  Explorer: `https://scan.test2.btcs.network/address/0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637`
- Marketplace: `0xAf59e08968446664acE238d3B3415179e5E2E428`  
  Explorer: `https://scan.test2.btcs.network/address/0xAf59e08968446664acE238d3B3415179e5E2E428`

### Run Locally

Prereqs: Node 20+, pnpm/npm, a Core wallet (MetaMask/Rabby).

1. Install: `cd Aeth && npm i`
2. Env `Aeth/.env`:
```ini
VITE_BACKEND_URL=https://YOUR-BACKEND.onrender.com
VITE_WC_PROJECT_ID=

# Core Testnet2
VITE_HERO_NFT_TESTNET=0x5b33069977773557D07023A73468fD16F83ebaea
VITE_STAKING_TESTNET=0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637
VITE_MARKETPLACE_TESTNET=0xAf59e08968446664acE238d3B3415179e5E2E428

# Optional demo mode
VITE_MOCKS=false
```
3. Dev: `npm run dev` (Vite)
4. Build: `npm run build` / Preview: `npm run preview`

### Backend (Quick Overview)

- Endpoints: `/auth/nonce/:address`, `/auth/login`, `/auth/refresh`, `/users/me`, `/users/me/heroes`, `/market/listings`
- Security: rate‑limits, CORS, JWT, optional Sentry
- Deployed on Render; set `CORS_ORIGINS` to your frontend origin and `JWT_SECRET`

### Submission & Network Policy (Testnet2)

This submission is deployed on Core Testnet2 due to local regulatory constraints. Per the Core Connect Global Buildathon rules, if selected as a finalist or winner, we will deploy to Core Mainnet within two (2) weeks after winners are announced.

- Current Testnet2 deployments: contracts, backend (Render), frontend (Vercel/Netlify)
- Explorer links above; backend URL used via `VITE_BACKEND_URL`

Mainnet Transition Plan:
1) Re‑deploy and verify contracts on Core Mainnet; 2) update frontend `.env` and addresses; 3) switch backend RPC; 4) publish release notes and documentation updates.

Nota (ES): Por regulación local, operamos en Testnet2 durante la evaluación. Si resultamos finalistas/ganadores, migraremos a Mainnet en ≤ 2 semanas tras el anuncio.

### License

MIT — Open use and contributions welcome.
