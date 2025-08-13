import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: ['env', '.env'],
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validationSchema: Joi.object({
        // PostgreSQL
        DATABASE_URL: Joi.string().uri().required(),

        // Redis
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),

        // CoreDAO
        CORE_RPC_URL: Joi.string().uri().required(),
        CORE_WEBSOCKET_RPC_URL: Joi.string().uri().required(),
        ORACLE_UPDATER_PRIVATE_KEY: Joi.string().pattern(/^0x[0-9a-fA-F]{64}$/).required(),
        ORACLE_CRON_ENABLED: Joi.boolean().default(true),
        ORACLE_DRY_RUN: Joi.boolean().default(true),

        // Contratos
        HERO_NFT_CONTRACT_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
        STAKING_ORACLE_CONTRACT_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
        STAKING_CONTRACT_ADDRESS: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),

        // JWT
        JWT_SECRET: Joi.string().min(32).required(),

        // IPFS
        PINATA_API_KEY: Joi.string().required(),
        PINATA_SECRET_API_KEY: Joi.string().required(),

        // Lógica
        ESSENCE_RATE_PER_SECOND: Joi.number().positive().required(),
      }),
    }),
  ],
})
export class ConfigModule {}
