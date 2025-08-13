import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('heroes')
export class HeroEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('idx_heroes_token')
  @Column({ type: 'int', unique: true })
  tokenId!: number;

  @Index('idx_heroes_owner')
  @Column({ type: 'varchar', length: 64 })
  ownerAddress!: string;

  @Column({ type: 'int', default: 1 })
  evolutionStage!: number;

  @Column({ type: 'varchar', length: 256, nullable: true })
  metadataCid?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}


