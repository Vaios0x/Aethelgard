import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class BlockchainListenerService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainListenerService.name);
  private wsProvider!: ethers.WebSocketProvider;
  private heroContract!: ethers.Contract;

  constructor(
    private readonly config: ConfigService,
    @InjectQueue('metadata-queue') private readonly metadataQueue: Queue,
  ) {}

  onModuleInit() {
    const wsUrl = this.config.get<string>('CORE_WEBSOCKET_RPC_URL')!;
    const heroAddress = this.config.get<string>('HERO_NFT_CONTRACT_ADDRESS')!;

    this.wsProvider = new ethers.WebSocketProvider(wsUrl);

    const heroAbi = [
      'event HeroEvolved(uint256 indexed tokenId, address indexed owner, uint256 newEvolutionStage)'
    ];
    this.heroContract = new ethers.Contract(heroAddress, heroAbi, this.wsProvider);

    this.heroContract.on('HeroEvolved', async (tokenId: ethers.BigNumberish, owner: string, newEvolutionStage: ethers.BigNumberish) => {
      try {
        const data = {
          tokenId: Number(tokenId.toString()),
          owner,
          newEvolutionStage: Number(newEvolutionStage.toString()),
        };
        this.logger.log(`Evento HeroEvolved recibido: ${JSON.stringify(data)}`);
        await this.metadataQueue.add('hero-evolution', data, { attempts: 5, backoff: { type: 'exponential', delay: 5000 } });
      } catch (err) {
        this.logger.error('Error encolando job de metadata', err as Error);
      }
    });

    this.logger.log('Listener de blockchain inicializado');
  }
}
