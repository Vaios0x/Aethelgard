import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroEntity } from './entities/hero.entity';
import axios from 'axios';

@Controller('metadata')
export class MetadataController {
  constructor(@InjectRepository(HeroEntity) private readonly heroRepo: Repository<HeroEntity>) {}

  @Get('hero/:tokenId')
  async getHeroMetadata(@Param('tokenId') tokenIdStr: string) {
    const tokenId = Number(tokenIdStr);
    const hero = await this.heroRepo.findOne({ where: { tokenId } });
    if (!hero?.metadataCid) throw new NotFoundException('Metadata no encontrada');
    const url = `https://ipfs.io/ipfs/${hero.metadataCid}`;
    const res = await axios.get(url, { timeout: 10000 });
    return res.data;
  }
}
