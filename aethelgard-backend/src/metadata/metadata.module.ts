import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeroEntity } from './entities/hero.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HeroEntity])],
  controllers: [MetadataController],
  providers: [MetadataService]
})
export class MetadataModule {}
