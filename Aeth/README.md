### Aethelgard – Frontend (English README available)

El Command Center para tus Héroes NFT en Core: evoluciona, stakea y comercia con una UX moderna, accesible y lista para producción.

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

> For the complete README in English (including Submission & Network Policy), see the root `README.md` of this repository.

### Pitch

Construimos Aethelgard para simplificar la vida de los holders de Héroes NFT en Core. Una sola app para:
- Evolucionar héroes con feedback claro y transacciones seguras.
- Stakear/Des-stakear y reclamar esencia (rewards) con tracking en tiempo real.
- Explorar y listar en el Marketplace con filtros, favoritos y paginación.

Todo con un diseño accesible, teclado-first, estados visibles de carga/éxito/error y soporte nativo para Core Mainnet y Testnet2.

### Demo y animaciones

- Hero (landing):
  <img alt="Landing hero" src="/images/landing-hero.svg" width="700" />
- Card de héroe (demo):
  <img alt="Hero demo" src="/images/hero-1.svg" width="420" />
- Marketplace placeholder:
  <img alt="Marketplace" src="/images/market-placeholder.svg" width="420" />

Animaciones UI incluidas:
- Spinner accesible dentro de botones de acción (usa `animate-spin`).
- Skeletons para estados de carga.
- Sombras/glow en notificaciones y foco accesible.

Ejemplo de spinner ya integrado en `Button.tsx`:
```tsx
{isLoading && (
  <span className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden />
)}
```

### Estructura del proyecto (Frontend)

- `src/main.tsx`: bootstrap con `HashRouter`, `WagmiProvider`, `RainbowKitProvider`, `QueryClientProvider` y `ToastProvider`.
- `src/App.tsx`: rutas principales y layout compartido.
- `src/components/`:
  - `layout/MainLayout.tsx`: Navbar, Footer, switch de redes Core, Toaster y región principal.
  - `web3/ConnectWalletButton.tsx`: conexión de wallet + login SIWE manual con feedback.
  - `game/*`: `HeroGrid`, `HeroCard`, `EvolutionPanel`.
  - `staking/*`: `StakingPanel`, `EssenceTracker`.
  - `marketplace/*`: filtros, tarjetas y grilla de listados (mock-ready).
  - `activity/ActivityList.tsx`: feed filtrable de actividad (mock store).
  - `ui/*`: `Button`, `Card`, `Skeleton`, `Tooltip`, `ThemeToggle`, `Toaster`.
- `src/hooks/`:
  - `useAethelgardContracts`: resuelve direcciones/ABIs por red (Core 1114/1116).
  - `useUserHeroes`: lectura de inventario (onchain o vía backend si hay JWT).
  - `useHeroEvolution`: envía `evolve` y registra actividad.
  - `useUserBalances`: `usePendingRewards` y acciones `stake/unstake/claim` (mock u onchain).
  - `useMarketplace`: CRUD de listados en modo mock + actividad.
  - `useActivity`: store de actividad (mock) y helpers.
- `src/lib/`:
  - `wagmi.ts`: definición de cadenas Core, connectors y `ensureChain`.
  - `api.ts`: SIWE (`getNonce`, `loginSiwe`) y `authorizedFetch` con JWT.
  - `notifications.tsx`: sistema de toasts lightweight.
  - `mockStore.ts`: estado simulado para marketplace/staking/actividad.
  - `utils.ts`: utilidades (`isMockMode`, `shortenAddress`, `ipfsToHttp`, etc.).
- `src/constants/`: `abis.ts` mínimos y `index.ts` con direcciones por red.
- `src/pages/`: `Landing`, `Dashboard`, `Marketplace`, `Staking`, `HeroDetail`, `NotFound`.
- `public/images/`: assets del landing y placeholders de UI.

### Flujo de autenticación (SIWE)

- El botón `Entrar` en `ConnectWalletButton` ejecuta:
  - `ensureChain` para asegurar Core Testnet2/Mainnet en la wallet.
  - `getNonce(address)` contra `VITE_BACKEND_URL`.
  - Construcción y firma del `SiweMessage` (dominio = hostname, sin puertos extra).
  - `loginSiwe(message, signature)` para obtener `accessToken` (guardado en `localStorage`).
- `RequireAuth` protege rutas sensibles (`/dashboard`, `/staking`) si no hay JWT.
- Tolerancia a fallos: si el backend está offline, muestra error y requiere configuración correcta.

### Modo Demo (Eliminado)

- El modo demo ha sido eliminado completamente.
- Todas las funcionalidades ahora usan contratos reales en Core Testnet2.
- No hay más simulaciones o mocks.

### Variables de entorno

Crear `Aeth/.env` con (o copiar desde este ejemplo):
```ini
# Backend API (opcional para SIWE y endpoints autorizados)
VITE_BACKEND_URL=http://localhost:3000

# RainbowKit / WalletConnect (opcional)
VITE_WC_PROJECT_ID=

# Contratos (Core Mainnet)
VITE_HERO_NFT_MAINNET=0x0000000000000000000000000000000000000000
VITE_STAKING_MAINNET=0x0000000000000000000000000000000000000000

# Contratos (Core Testnet2)
VITE_HERO_NFT_TESTNET=0x5b33069977773557D07023A73468fD16F83ebaea
VITE_STAKING_TESTNET=0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637
VITE_MARKETPLACE_TESTNET=0xAf59e08968446664acE238d3B3415179e5E2E428

# Demo mode (eliminado - solo contratos reales)
# VITE_MOCKS=false
```

### Configuración Rápida para Core Testnet2

1. **Clona el repositorio**:
   ```bash
   git clone <repo-url>
   cd Aeth/Aeth
   ```

2. **Instala dependencias**:
   ```bash
   npm install
   ```

3. **Configura variables de entorno**:
   ```bash
   cp env.example .env
   # El archivo .env ya tiene las direcciones correctas de Core Testnet2
   ```

4. **Ejecuta el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

5. **Verifica la configuración** (opcional):
   ```bash
   node scripts/verify-setup.js
   ```

### Scripts (Frontend)

- `npm i` — instalar dependencias
- `npm run dev` — servidor de desarrollo (Vite)
- `npm run build` — build de producción
- `npm run preview` — vista previa del build
- `node scripts/verify-setup.js` — verificar configuración

### Integración con Core

- Redes soportadas:
  - Core Mainnet (1116): RPC `https://rpc.coredao.org`, Explorer `https://scan.coredao.org`.
  - Core Testnet2 (1114): RPC `https://rpc.test2.btcs.network`, Explorer `https://scan.test2.btcs.network`.
- `ensureChain` añade/cambia la red en la wallet si no está presente.

### Direcciones desplegadas (Core Testnet2)

- HeroNFT: `0x5b33069977773557D07023A73468fD16F83ebaea`  
  Explorer: `https://scan.test2.btcs.network/address/0x5b33069977773557D07023A73468fD16F83ebaea`
- Staking: `0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637`  
  Explorer: `https://scan.test2.btcs.network/address/0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637`
- Marketplace: `0xAf59e08968446664acE238d3B3415179e5E2E428`  
  Explorer: `https://scan.test2.btcs.network/address/0xAf59e08968446664acE238d3B3415179e5E2E428`

### Live Demo

- Frontend: https://aethelgard-one.vercel.app/

### Documentación Adicional

- **Configuración detallada**: [SETUP_TESTNET.md](./SETUP_TESTNET.md) - Guía completa para Core Testnet2
- **Verificación de setup**: `node scripts/verify-setup.js` - Script para verificar configuración

### Accesibilidad

- Navegación con teclado completa en navbar/links/botones/drawers.
- Estados visibles con mensajes claros (éxito, error, carga, vacío) y `aria-live`.
- Contraste adecuado y foco visible; tooltips y toasts no bloquean la navegación.

### Backend (resumen rápido)

- Endpoints esperados por la UI:
  - `GET /auth/nonce/:address` — nonce SIWE.
  - `POST /auth/login` — valida firma y devuelve `{ accessToken, walletAddress }`.
  - `GET /users/me` — perfil del usuario autenticado.
  - `GET /users/me/heroes` — inventario de héroes (opcional, acelera la carga).
  - `GET /market/listings` — listados activos del Marketplace (Testnet2) indexados desde eventos.
- El token se guarda con clave `AETH_JWT` en `localStorage`.

### Roadmap corto

- Contratos reales para marketplace y staking (actualizar ABIs/addresses).
- Paginación onchain y metadatos cacheados en backend.
- Métricas UX (tiempos de confirmación, reintentos, toasts enriquecidos).

### Submission & Network Policy (Testnet2)

This project is currently deployed on Core Testnet2 due to regulatory constraints in our jurisdiction. Per the Buildathon rules, if selected as a finalist or winner, we commit to deploying to Core Mainnet within two (2) weeks after winners are announced.

- Testnet2 deployments are live (contracts, backend on Render, frontend on Vercel/Netlify).
- Set `VITE_BACKEND_URL` in the frontend to the Render base URL.
- Core Testnet2 Scan links are provided for all contracts.

Nota (ES): Por regulación local, se presenta en Testnet2. En caso de ser finalistas/ganadores, migraremos a Mainnet en ≤ 2 semanas tras el anuncio.

### Licencia

MIT — Usa, modifica y despliega libremente. Se agradecen PRs y sugerencias.
