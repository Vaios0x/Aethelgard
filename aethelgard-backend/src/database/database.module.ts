import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../users/entities/user.entity';
import { HeroEntity } from '../metadata/entities/hero.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [UserEntity, HeroEntity],
        synchronize: true,
        logging: ['error', 'warn'],
        ssl: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
