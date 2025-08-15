# 🏪 Configuración del Marketplace

## Estado Actual

El marketplace de Aethelgard está **completamente funcional** con las siguientes características:

### ✅ Funcionalidades Implementadas

- **Sistema de Favoritos**: Guardado persistente en localStorage
- **Filtros Avanzados**: Por precio, clase, nivel, poder, favoritos y propios
- **Ordenamiento**: Por precio, nombre, nivel, poder y fecha
- **Paginación**: Configurable (6, 12, 24, 48 items por página)
- **Modo Demo**: Datos de ejemplo cuando el backend no está disponible
- **Transacciones Reales**: Compra, listado y cancelación en Core Testnet2

### 🎮 Modo Demo

Cuando el backend no está disponible o los contratos no están configurados, el marketplace automáticamente:

1. **Muestra datos de ejemplo** con 6 héroes de diferentes clases y niveles
2. **Simula transacciones** con notificaciones informativas
3. **Mantiene todas las funcionalidades** de filtros, ordenamiento y favoritos
4. **Indica claramente** que está en modo demo

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env` en la carpeta `Aeth/` con:

```bash
# Backend API (opcional)
VITE_BACKEND_URL=https://aethelgard-backend.onrender.com

# Contratos Core Testnet2 (YA DESPLEGADOS)
VITE_HERO_NFT_TESTNET=0x5b33069977773557D07023A73468fD16F83ebaea
VITE_STAKING_TESTNET=0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637
VITE_MARKETPLACE_TESTNET=0xAf59e08968446664acE238d3B3415179e5E2E428

# Configuración opcional
VITE_MARKETPLACE_ENABLED=true
VITE_DEMO_MODE=false
```

### 2. Verificar Configuración

Ejecuta el script de verificación:

```bash
cd Aeth/
node scripts/verify-setup.js
```

### 3. Iniciar el Proyecto

```bash
npm install
npm run dev
```

## Uso del Marketplace

### Navegación
- **Filtros Básicos**: Búsqueda, precio mínimo/máximo, clase
- **Filtros Avanzados**: Nivel, poder, favoritos, propios
- **Ordenamiento**: Clic en cualquier columna para ordenar
- **Paginación**: Navegación completa con páginas numeradas

### Acciones Disponibles
- **Comprar**: Clic en "Comprar" en cualquier listado
- **Listar**: Desde el Dashboard, botón "Listar" en héroes
- **Cancelar**: En tus propios listados
- **Favoritos**: Estrella en cada listado

### Estados del Sistema
- **✅ Conectado**: Transacciones reales en Core Testnet2
- **🎮 Demo**: Datos de ejemplo, transacciones simuladas
- **⚠️ Error**: Backend offline, usando datos de ejemplo

## Contratos Desplegados

### Core Testnet2 (Chain ID: 1114)
- **HeroNFT**: `0x5b33069977773557D07023A73468fD16F83ebaea`
- **Staking**: `0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637`
- **Marketplace**: `0xAf59e08968446664acE238d3B3415179e5E2E428`

### Exploradores
- **Testnet2**: https://scan.test2.btcs.network
- **Mainnet**: https://scan.coredao.org

## Solución de Problemas

### Error "Backend no disponible"
- **Causa**: El backend está offline o no configurado
- **Solución**: El sistema automáticamente usa datos de ejemplo
- **Acción**: No es necesario hacer nada, funciona en modo demo

### Error "Marketplace no configurado"
- **Causa**: Variables de entorno no configuradas
- **Solución**: Crear archivo `.env` con las direcciones de contratos
- **Acción**: Verificar `VITE_MARKETPLACE_TESTNET` está configurado

### Error "Saldo insuficiente"
- **Causa**: No tienes suficiente CORE para la transacción
- **Solución**: Obtener CORE de un faucet de Core Testnet2
- **Acción**: Usar faucet oficial de Core DAO

## Características Técnicas

### Persistencia
- **Favoritos**: Guardados en localStorage
- **Filtros**: Persistidos entre sesiones
- **Configuración**: Paginación y ordenamiento recordados

### Performance
- **Filtrado**: Optimizado con memoización
- **Ordenamiento**: Algoritmos eficientes
- **Paginación**: Carga bajo demanda

### Seguridad
- **Validaciones**: Balance, ownership, approvals
- **Transacciones**: Gas estimation y confirmación
- **Errores**: Manejo robusto de fallos

## Próximos Pasos

1. **Despliegue a Mainnet**: Cuando esté listo
2. **Backend Completo**: Endpoints adicionales
3. **Analytics**: Métricas de uso
4. **Optimizaciones**: Performance y UX

---

El marketplace está **listo para producción** y funcionará perfectamente tanto con backend real como en modo demo. 🚀
