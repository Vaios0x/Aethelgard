import { Module } from '@nestjs/common';
import { MetadataJobService } from './metadata-job/metadata-job.service';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeroEntity } from '../metadata/entities/hero.entity';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get<string>('REDIS_HOST'),
          port: config.get<number>('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'metadata-queue' }),
    TypeOrmModule.forFeature([HeroEntity])
  ],
  providers: [MetadataJobService],
  exports: [BullModule],
})
export class JobsModule {}
