import { ethers } from 'ethers';
import { cacheManager, CacheInvalidationEvent } from './cacheManager';

// Eventos blockchain que invalidan caché
export interface BlockchainEvent {
  type: string;
  blockNumber: number;
  transactionHash: string;
  address: string;
  data: any;
  timestamp: number;
}

// Configuración de eventos
export interface EventConfig {
  eventName: string;
  contractAddress: string;
  topics: string[];
  cacheTypes: string[];
  dataExtractor: (log: ethers.Log) => any;
}

// Sistema de invalidación de caché basado en eventos blockchain
export class BlockchainEventCache {
  private provider: ethers.Provider;
  private eventConfigs: Map<string, EventConfig> = new Map();
  private lastProcessedBlock: number = 0;
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
    this.initializeEventConfigs();
  }

  // Configurar eventos de invalidación
  private initializeEventConfigs() {
    const configs: EventConfig[] = [
      // Eventos de héroes
      {
        eventName: 'hero-evolved',
        contractAddress: process.env.HERO_NFT_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('HeroEvolved(uint256,uint256,uint256)')).slice(2)],
        cacheTypes: ['metadata', 'heroes', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event HeroEvolved(uint256 indexed tokenId, uint256 oldLevel, uint256 newLevel)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            tokenId: parsed.args.tokenId.toString(),
            oldLevel: parsed.args.oldLevel.toString(),
            newLevel: parsed.args.newLevel.toString()
          };
        }
      },
      {
        eventName: 'hero-transferred',
        contractAddress: process.env.HERO_NFT_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('Transfer(address,address,uint256)')).slice(2)],
        cacheTypes: ['metadata', 'heroes', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            from: parsed.args.from,
            to: parsed.args.to,
            tokenId: parsed.args.tokenId.toString()
          };
        }
      },
      {
        eventName: 'hero-minted',
        contractAddress: process.env.HERO_NFT_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('HeroMinted(uint256,address,uint256)')).slice(2)],
        cacheTypes: ['metadata', 'heroes', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event HeroMinted(uint256 indexed tokenId, address indexed owner, uint256 level)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            tokenId: parsed.args.tokenId.toString(),
            owner: parsed.args.owner,
            level: parsed.args.level.toString()
          };
        }
      },

      // Eventos de staking
      {
        eventName: 'hero-staked',
        contractAddress: process.env.STAKING_CONTRACT_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('HeroStaked(uint256,address)')).slice(2)],
        cacheTypes: ['heroes', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event HeroStaked(uint256 indexed tokenId, address indexed owner)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            tokenId: parsed.args.tokenId.toString(),
            owner: parsed.args.owner
          };
        }
      },
      {
        eventName: 'hero-unstaked',
        contractAddress: process.env.STAKING_CONTRACT_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('HeroUnstaked(uint256,address)')).slice(2)],
        cacheTypes: ['heroes', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event HeroUnstaked(uint256 indexed tokenId, address indexed owner)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            tokenId: parsed.args.tokenId.toString(),
            owner: parsed.args.owner
          };
        }
      },

      // Eventos de marketplace
      {
        eventName: 'listing-created',
        contractAddress: process.env.MARKETPLACE_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('Listed(address,address,uint256,uint256)')).slice(2)],
        cacheTypes: ['listings'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event Listed(address indexed seller, address indexed nft, uint256 indexed tokenId, uint256 price)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            seller: parsed.args.seller,
            nft: parsed.args.nft,
            tokenId: parsed.args.tokenId.toString(),
            price: parsed.args.price.toString()
          };
        }
      },
      {
        eventName: 'listing-sold',
        contractAddress: process.env.MARKETPLACE_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('Bought(address,address,uint256,uint256)')).slice(2)],
        cacheTypes: ['listings', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event Bought(address indexed buyer, address indexed nft, uint256 indexed tokenId, uint256 price)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            buyer: parsed.args.buyer,
            nft: parsed.args.nft,
            tokenId: parsed.args.tokenId.toString(),
            price: parsed.args.price.toString()
          };
        }
      },
      {
        eventName: 'listing-cancelled',
        contractAddress: process.env.MARKETPLACE_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('Canceled(address,address,uint256)')).slice(2)],
        cacheTypes: ['listings'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event Canceled(address indexed seller, address indexed nft, uint256 indexed tokenId)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            seller: parsed.args.seller,
            nft: parsed.args.nft,
            tokenId: parsed.args.tokenId.toString()
          };
        }
      },

      // Eventos de esencia
      {
        eventName: 'essence-transferred',
        contractAddress: process.env.ESSENCE_TOKEN_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('Transfer(address,address,uint256)')).slice(2)],
        cacheTypes: ['essence', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event Transfer(address indexed from, address indexed to, uint256 value)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            from: parsed.args.from,
            to: parsed.args.to,
            value: parsed.args.value.toString()
          };
        }
      },
      {
        eventName: 'essence-minted',
        contractAddress: process.env.ESSENCE_TOKEN_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('Minted(address,uint256)')).slice(2)],
        cacheTypes: ['essence', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event Minted(address indexed to, uint256 amount)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            to: parsed.args.to,
            amount: parsed.args.amount.toString()
          };
        }
      },
      {
        eventName: 'essence-burned',
        contractAddress: process.env.ESSENCE_TOKEN_ADDR || '',
        topics: ['0x' + ethers.keccak256(ethers.toUtf8Bytes('Burned(address,uint256)')).slice(2)],
        cacheTypes: ['essence', 'stats'],
        dataExtractor: (log) => {
          const iface = new ethers.Interface([
            'event Burned(address indexed from, uint256 amount)'
          ]);
          const parsed = iface.parseLog(log);
          return {
            from: parsed.args.from,
            amount: parsed.args.amount.toString()
          };
        }
      }
    ];

    configs.forEach(config => {
      this.eventConfigs.set(config.eventName, config);
    });
  }

  // Iniciar procesamiento de eventos
  async startProcessing(fromBlock?: number): Promise<void> {
    if (this.isProcessing) {
      console.warn('Blockchain event processing already started');
      return;
    }

    this.isProcessing = true;
    
    // Obtener último bloque procesado
    if (!fromBlock) {
      this.lastProcessedBlock = await this.getLastProcessedBlock();
    } else {
      this.lastProcessedBlock = fromBlock;
    }

    console.log(`Starting blockchain event processing from block ${this.lastProcessedBlock}`);

    // Procesar eventos cada 10 segundos
    this.processingInterval = setInterval(async () => {
      await this.processNewEvents();
    }, 10000);
  }

  // Detener procesamiento de eventos
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    console.log('Blockchain event processing stopped');
  }

  // Procesar nuevos eventos
  private async processNewEvents(): Promise<void> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      
      if (currentBlock <= this.lastProcessedBlock) {
        return;
      }

      console.log(`Processing events from block ${this.lastProcessedBlock + 1} to ${currentBlock}`);

      // Procesar eventos de cada configuración
      for (const [eventName, config] of this.eventConfigs.entries()) {
        if (!config.contractAddress) continue;

        try {
          const logs = await this.provider.getLogs({
            address: config.contractAddress,
            fromBlock: this.lastProcessedBlock + 1,
            toBlock: currentBlock,
            topics: config.topics
          });

          for (const log of logs) {
            await this.processEvent(eventName, config, log);
          }
        } catch (error) {
          console.error(`Error processing events for ${eventName}:`, error);
        }
      }

      this.lastProcessedBlock = currentBlock;
      await this.saveLastProcessedBlock(currentBlock);

    } catch (error) {
      console.error('Error processing blockchain events:', error);
    }
  }

  // Procesar un evento individual
  private async processEvent(eventName: string, config: EventConfig, log: ethers.Log): Promise<void> {
    try {
      const eventData = config.dataExtractor(log);
      const block = await this.provider.getBlock(log.blockNumber);
      
      const blockchainEvent: BlockchainEvent = {
        type: eventName,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        address: log.address,
        data: eventData,
        timestamp: block?.timestamp || Date.now()
      };

      console.log(`Processing event: ${eventName}`, {
        tokenId: eventData.tokenId,
        blockNumber: log.blockNumber,
        txHash: log.transactionHash
      });

      // Invalidar cachés correspondientes
      await this.invalidateCaches(eventName, blockchainEvent);

    } catch (error) {
      console.error(`Error processing event ${eventName}:`, error);
    }
  }

  // Invalidar cachés basado en evento
  private async invalidateCaches(eventName: string, event: BlockchainEvent): Promise<void> {
    const config = this.eventConfigs.get(eventName);
    if (!config) return;

    // Invalidar cachés específicos
    for (const cacheType of config.cacheTypes) {
      await cacheManager.invalidateByEvent(eventName, event);
    }

    // Invalidaciones específicas por tipo de evento
    switch (eventName) {
      case 'hero-evolved':
      case 'hero-transferred':
      case 'hero-minted':
        if (event.data.tokenId) {
          await cacheManager.invalidate('metadata', event.data.tokenId);
          await cacheManager.invalidate('heroes', event.data.tokenId);
        }
        break;

      case 'hero-staked':
      case 'hero-unstaked':
        if (event.data.tokenId) {
          await cacheManager.invalidate('heroes', event.data.tokenId);
        }
        if (event.data.owner) {
          await cacheManager.invalidate('stats', event.data.owner);
        }
        break;

      case 'listing-created':
      case 'listing-sold':
      case 'listing-cancelled':
        await cacheManager.invalidate('listings');
        break;

      case 'essence-transferred':
      case 'essence-minted':
      case 'essence-burned':
        if (event.data.from && event.data.from !== ethers.ZeroAddress) {
          await cacheManager.invalidate('essence', event.data.from);
          await cacheManager.invalidate('stats', event.data.from);
        }
        if (event.data.to && event.data.to !== ethers.ZeroAddress) {
          await cacheManager.invalidate('essence', event.data.to);
          await cacheManager.invalidate('stats', event.data.to);
        }
        break;
    }
  }

  // Obtener último bloque procesado
  private async getLastProcessedBlock(): Promise<number> {
    try {
      // En producción, esto debería venir de una base de datos
      const stored = process.env.LAST_PROCESSED_BLOCK;
      if (stored) {
        return parseInt(stored);
      }
    } catch (error) {
      console.warn('Error getting last processed block:', error);
    }

    // Si no hay bloque guardado, usar el bloque actual menos 1000
    const currentBlock = await this.provider.getBlockNumber();
    return Math.max(0, currentBlock - 1000);
  }

  // Guardar último bloque procesado
  private async saveLastProcessedBlock(blockNumber: number): Promise<void> {
    try {
      // En producción, esto debería guardarse en una base de datos
      process.env.LAST_PROCESSED_BLOCK = blockNumber.toString();
    } catch (error) {
      console.warn('Error saving last processed block:', error);
    }
  }

  // Procesar eventos manualmente
  async processEventsManually(fromBlock: number, toBlock: number): Promise<void> {
    console.log(`Manually processing events from block ${fromBlock} to ${toBlock}`);
    
    for (const [eventName, config] of this.eventConfigs.entries()) {
      if (!config.contractAddress) continue;

      try {
        const logs = await this.provider.getLogs({
          address: config.contractAddress,
          fromBlock,
          toBlock,
          topics: config.topics
        });

        console.log(`Found ${logs.length} events for ${eventName}`);

        for (const log of logs) {
          await this.processEvent(eventName, config, log);
        }
      } catch (error) {
        console.error(`Error manually processing events for ${eventName}:`, error);
      }
    }
  }

  // Obtener estadísticas de eventos
  getEventStats(): Record<string, { processed: number; lastProcessed: number }> {
    const stats: Record<string, { processed: number; lastProcessed: number }> = {};
    
    for (const [eventName, config] of this.eventConfigs.entries()) {
      stats[eventName] = {
        processed: 0, // En producción, esto vendría de una base de datos
        lastProcessed: this.lastProcessedBlock
      };
    }

    return stats;
  }

  // Verificar si está procesando
  isEventProcessing(): boolean {
    return this.isProcessing;
  }

  // Obtener último bloque procesado
  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }
}
