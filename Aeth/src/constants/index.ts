// Direcciones de contratos por red
export const CONTRACTS = {
  // Core Mainnet (1116)
  mainnet: {
    heroNft: '0x0000000000000000000000000000000000000000',
    staking: '0x0000000000000000000000000000000000000000',
    marketplace: '0x0000000000000000000000000000000000000000',
    essenceToken: '0x0000000000000000000000000000000000000000',
  },
  // Core Testnet2 (1114)
  testnet2: {
    heroNft: '0x5b33069977773557D07023A73468fD16F83ebaea',
    staking: '0xE01592cE50FeFF1e9FB65888c66Dd5c6c4C85637',
    marketplace: '0xAf59e08968446664acE238d3B3415179e5E2E428',
    essenceToken: '0x1234567890123456789012345678901234567890', // Placeholder - actualizar después del deployment
  },
} as const;

// Configuración de evolución
export const EVOLUTION_CONFIG = {
  baseEssenceCost: 100n * 10n**18n,    // 100 esencia base
  levelMultiplier: 50n * 10n**18n,     // 50 esencia por nivel
  stageMultiplier: 200n * 10n**18n,    // 200 esencia por etapa
  maxLevel: 100n,                      // Nivel máximo 100
  maxStage: 5n,                        // 5 etapas de evolución
  evolutionCooldown: 3600n,            // 1 hora de cooldown
} as const;

// Clases de héroes
export const HERO_CLASSES = {
  1: 'Warrior',
  2: 'Mage',
  3: 'Ranger',
  4: 'Paladin',
  5: 'Assassin',
} as const;

// Rarezas de héroes
export const HERO_RARITIES = {
  1: 'Common',
  2: 'Rare',
  3: 'Epic',
  4: 'Legendary',
  5: 'Mythic',
} as const;

// Colores por clase
export const CLASS_COLORS = {
  Warrior: 'text-red-400',
  Mage: 'text-blue-400',
  Ranger: 'text-green-400',
  Paladin: 'text-yellow-400',
  Assassin: 'text-purple-400',
} as const;

// Colores por rareza
export const RARITY_COLORS = {
  Common: 'text-gray-400',
  Rare: 'text-blue-400',
  Epic: 'text-purple-400',
  Legendary: 'text-yellow-400',
  Mythic: 'text-red-400',
} as const;

// Etapas de evolución
export const EVOLUTION_STAGES = {
  0: 'Novice',
  1: 'Apprentice',
  2: 'Adept',
  3: 'Master',
  4: 'Grandmaster',
  5: 'Legend',
} as const;

// Configuración de esencia
export const ESSENCE_CONFIG = {
  initialSupply: 1000000n * 10n**18n,  // 1M tokens iniciales
  maxSupply: 10000000n * 10n**18n,     // 10M tokens máximo
  rewardAmount: 100n * 10n**18n,       // 100 tokens por recompensa
} as const;


