# Configuración para Core Testnet2

Este documento explica cómo configurar Aethelgard para funcionar completamente en Core Testnet2.

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# Backend API (para SIWE y endpoints autorizados)
VITE_BACKEND_URL=https://aethelgard-backend.onrender.com

# RainbowKit / WalletConnect (opcional)
VITE_WC_PROJECT_ID=

# Contratos Core Testnet2
VITE_HERO_NFT_TESTNET=0x5b33069977773557D07023A73468fD16F83ebaea
VITE_STAKING_TESTNET=0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637
VITE_MARKETPLACE_TESTNET=0xAf59e08968446664acE238d3B3415179e5E2E428

# Demo mode (false para usar contratos reales)
VITE_MOCKS=false
```

## Contratos Desplegados

### 1. HeroNFT Contract
- **Dirección**: `0x5b33069977773557D07023A73468fD16F83ebaea`
- **Explorer**: https://scan.test2.btcs.network/address/0x5b33069977773557D07023A73468fD16F83ebaea
- **Funciones principales**:
  - `mintSelf(uint256 amount)` - Crear héroes
  - `evolve(uint256 tokenId)` - Evolucionar héroe
  - `balanceOf(address owner)` - Obtener balance
  - `tokenOfOwnerByIndex(address owner, uint256 index)` - Obtener token por índice

### 2. Staking Contract
- **Dirección**: `0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637`
- **Explorer**: https://scan.test2.btcs.network/address/0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637
- **Funciones principales**:
  - `stake(uint256[] tokenIds)` - Stakear héroes
  - `unstake(uint256[] tokenIds)` - Des-stakear héroes
  - `claimRewards(uint256[] tokenIds)` - Reclamar recompensas
  - `pendingRewards(address user)` - Obtener recompensas pendientes
  - `isStaked(uint256 tokenId)` - Verificar si está stakeado

### 3. Marketplace Contract
- **Dirección**: `0xAf59e08968446664acE238d3B3415179e5E2E428`
- **Explorer**: https://scan.test2.btcs.network/address/0xAf59e08968446664acE238d3B3415179e5E2E428
- **Funciones principales**:
  - `list(address nft, uint256 tokenId, uint256 price)` - Listar NFT
  - `buy(address nft, uint256 tokenId)` - Comprar NFT
  - `cancel(address nft, uint256 tokenId)` - Cancelar listado
  - `listings(bytes32)` - Obtener información de listado

## Configuración de Red

### Core Testnet2
- **Chain ID**: 1114
- **RPC URL**: https://rpc.test2.btcs.network
- **Explorer**: https://scan.test2.btcs.network
- **Moneda**: tCORE (Testnet CORE)

### Configuración Automática
La aplicación automáticamente:
1. Detecta si estás en Core Testnet2
2. Si no, muestra un aviso para cambiar de red
3. Proporciona un botón para cambiar automáticamente
4. Usa `ensureChain()` para agregar la red si no existe

## Funcionalidades Habilitadas

### ✅ Dashboard
- Ver héroes NFT del usuario
- Crear nuevos héroes con `mintSelf()`
- Ver actividad reciente

### ✅ Staking
- Stakear/des-stakear héroes
- Ver recompensas pendientes
- Reclamar esencia acumulada

### ✅ Marketplace
- Listar héroes para venta
- Comprar héroes listados
- Cancelar listados propios

### ✅ Evolución
- Evolucionar héroes con `evolve()`
- Ver progreso de evolución

### ✅ Autenticación
- Login con SIWE (Sign-In with Ethereum)
- Sesiones persistentes con JWT
- Integración con backend

## Modo Onchain (Solo Contratos Reales)

- Usa contratos reales en Core Testnet2
- Transacciones reales con gas
- Datos reales de la blockchain
- No hay modo demo disponible

## Troubleshooting

### Error: "Contrato no configurado"
1. Verifica que las variables de entorno estén configuradas
2. Confirma que estás en Core Testnet2

### Error: "Backend no disponible"
1. Verifica `VITE_BACKEND_URL`
2. El backend debe estar desplegado en Render
3. Sin backend, algunas funcionalidades pueden no estar disponibles

### Error: "Red no soportada"
1. Cambia a Core Testnet2 en tu wallet
2. Usa el botón "Core Testnet2" en el aviso
3. La app agregará la red automáticamente

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp env.example .env
# Editar .env con las direcciones correctas

# Ejecutar en modo desarrollo
npm run dev

# Build para producción
npm run build
```

## Verificación

Para verificar que todo funciona:

1. **Conecta tu wallet** (MetaMask, Rabby, etc.)
2. **Cambia a Core Testnet2** si es necesario
3. **Ve al Dashboard** - deberías ver tus héroes
4. **Prueba Staking** - stakear/des-stakear héroes
5. **Prueba Marketplace** - listar/comprar héroes
6. **Prueba Evolución** - evolucionar héroes

Si todo funciona correctamente, verás transacciones reales en el explorer de Core Testnet2.
