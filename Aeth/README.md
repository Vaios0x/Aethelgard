# Aethelgard – Frontend

Dashboard/Marketplace/Staking dApp para Core DAO (Mainnet/Testnet2), construido con Vite + React + TypeScript + Tailwind + Wagmi v2 + RainbowKit + Viem + Ethers v6.

## Scripts

- `npm i`
- `npm run dev`
- `npm run build`
- `npm run preview`

## Variables de entorno

Crear `.env` con (o copiar desde `.env.example`):

```ini
# Backend API base URL
VITE_BACKEND_URL=http://localhost:3000

# RainbowKit / WalletConnect (opcional). Si no se define, WalletConnect queda deshabilitado.
VITE_WC_PROJECT_ID=

# Dirección de contratos (Core Mainnet)
VITE_HERO_NFT_MAINNET=0x0000000000000000000000000000000000000000
VITE_STAKING_MAINNET=0x0000000000000000000000000000000000000000

# Dirección de contratos (Core Testnet2)
VITE_HERO_NFT_TESTNET=0x0000000000000000000000000000000000000000
VITE_STAKING_TESTNET=0x0000000000000000000000000000000000000000

# Modo mock (solo para desarrollo)
VITE_MOCKS=true
```

## Accesibilidad

Componentes navegables con teclado y estados de carga/éxito/error visibles.

## Modo mocks

Con `VITE_MOCKS=true`, la app evita lecturas/escrituras onchain y muestra datos simulados (héroes, balances). Útil mientras no configuras contratos/`projectId`.

También puedes alternar en runtime con el botón "Demo Mode" del Navbar (usa `localStorage.AETH_MOCKS`).

## Tailwind CSS

- Documentación base: `https://tailwindcss.com/docs`
- Instalación en Vite: `https://tailwindcss.com/docs/guides/vite`
- Plugins habilitados: forms, typography, aspect-ratio, line-clamp, container-queries.
- Optimización producción: `https://tailwindcss.com/docs/optimizing-for-production`

### Editor e IntelliSense
- VS Code setup: `https://tailwindcss.com/docs/editor-setup`

### Conceptos clave usados
- Utility-first, responsive, estados hover/focus, dark theme por defecto, `@apply` en `src/styles/index.css`.

## Redes Core
- Core Mainnet (1116): RPC `https://rpc.coredao.org`, Explorer `https://scan.coredao.org`.
- Core Testnet2 (1114): RPC `https://rpc.test2.btcs.network`, Explorer `https://scan.test2.btcs.network`.

## Pasar de mock a onchain
1) Definir contratos en `.env` y `VITE_WC_PROJECT_ID`.
2) Alternar "Demo Mode" a OFF o definir `VITE_MOCKS=false`.
3) Reiniciar el servidor.

## Checklist hackathon
- Repo con README y scripts.
- Demo en video (UI + flujo Web3 + integración Core).
- Presentación breve (pitch, innovación, roadmap onchain).
- Despliegue a Testnet2/Mainnet.


