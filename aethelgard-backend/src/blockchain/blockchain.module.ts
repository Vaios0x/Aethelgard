import { Module } from '@nestjs/common';
import { BlockchainListenerService } from './blockchain-listener/blockchain-listener.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [BullModule.registerQueue({ name: 'metadata-queue' })],
  providers: [BlockchainListenerService]
})
export class BlockchainModule {}
