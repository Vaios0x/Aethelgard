import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { JobsModule } from './jobs/jobs.module';
import { MetadataModule } from './metadata/metadata.module';
import { OracleModule } from './oracle/oracle.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, BlockchainModule, JobsModule, MetadataModule, OracleModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
