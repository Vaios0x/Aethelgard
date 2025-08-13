import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { HeroEntity } from '../../metadata/entities/hero.entity';

type EvolutionJobData = { tokenId: number; newEvolutionStage: number };

@Processor('metadata-queue')
@Injectable()
export class MetadataJobService {
  private readonly logger = new Logger(MetadataJobService.name);
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(HeroEntity) private readonly heroRepo: Repository<HeroEntity>,
  ) {}

  @Process('hero-evolution')
  async handleEvolutionJob(job: Job<EvolutionJobData>) {
    const { tokenId, newEvolutionStage } = job.data;
    this.logger.log(`Procesando evolución tokenId=${tokenId} stage=${newEvolutionStage}`);

    // 1) Generar metadatos
    const name = `Héroe #${tokenId} - Etapa ${newEvolutionStage}`;
    const description = `El héroe ha ascendido a la etapa ${newEvolutionStage}.`;

    // 2) Seleccionar imagen simplificada
    const imagePath = `hero_class_default/stage_${newEvolutionStage}.png`;

    // 3) Subir imagen a IPFS vía Pinata (usando API HTTP simple)
    const pinataKey = this.config.get<string>('PINATA_API_KEY');
    const pinataSecret = this.config.get<string>('PINATA_SECRET_API_KEY');

    const pinFile = async (path: string) => {
      // Placeholder: en un entorno real, leerías el archivo del disco/FS o generarías la imagen
      // Aquí subimos un PNG mínimo como bytes ficticios
      const content = Buffer.from('89504E470D0A1A0A', 'hex');
      const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', content, {
        headers: {
          'Content-Type': 'application/octet-stream',
          pinata_api_key: pinataKey!,
          pinata_secret_api_key: pinataSecret!,
        },
      });
      return res.data.IpfsHash as string;
    };

    const imageCid = await pinFile(imagePath);

    // 4) Armar JSON final
    const metadata = {
      name,
      description,
      image: `ipfs://${imageCid}`,
      attributes: [
        { trait_type: 'Evolution Stage', value: newEvolutionStage },
      ],
    };

    // 5) Subir JSON
    const jsonRes = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', metadata, {
      headers: { pinata_api_key: pinataKey!, pinata_secret_api_key: pinataSecret! },
    });
    const metadataCid = jsonRes.data.IpfsHash as string;

    // 6) Actualizar DB
    let hero = await this.heroRepo.findOne({ where: { tokenId } });
    if (!hero) {
      hero = this.heroRepo.create({ tokenId, ownerAddress: '0x0000000000000000000000000000000000000000', evolutionStage: newEvolutionStage, metadataCid });
    } else {
      hero.evolutionStage = newEvolutionStage;
      hero.metadataCid = metadataCid;
    }
    await this.heroRepo.save(hero);

    this.logger.log(`Metadata actualizada tokenId=${tokenId} cid=${metadataCid}`);
  }
}
