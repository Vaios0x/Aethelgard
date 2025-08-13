import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private readonly repo: Repository<UserEntity>) {}

  async findByWallet(address: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { walletAddress: address.toLowerCase() } });
  }

  async upsertNonce(address: string, nonce: string): Promise<UserEntity> {
    const walletAddress = address.toLowerCase();
    let user = await this.repo.findOne({ where: { walletAddress } });
    if (!user) {
      user = this.repo.create({ walletAddress, nonce });
    } else {
      user.nonce = nonce;
    }
    return this.repo.save(user);
  }
}
