import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { SiweMessage } from 'siwe';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {}

  async generateNonce(address?: string): Promise<string> {
    const nonce = randomBytes(16).toString('hex');
    if (address) await this.users.upsertNonce(address, nonce);
    return nonce;
  }

  async verifySiweAndIssueJwt(message: string, signature: string): Promise<{ accessToken: string; walletAddress: string }>
  {
    // Verificar SIWE
    let siwe: SiweMessage;
    try {
      siwe = new SiweMessage(message);
    } catch {
      throw new UnauthorizedException('Mensaje SIWE inválido');
    }
    const fields = await siwe.verify({ signature });
    if (!fields.success) throw new UnauthorizedException('Firma inválida');

    const walletAddress = ethers.getAddress(siwe.address);
    const user = await this.users.findByWallet(walletAddress);
    if (!user || !user.nonce || user.nonce !== siwe.nonce) {
      throw new UnauthorizedException('Nonce inválido');
    }
    const payload = { sub: walletAddress };
    const accessToken = await this.jwt.signAsync(payload);
    await this.users.upsertNonce(walletAddress, randomBytes(16).toString('hex'));
    return { accessToken, walletAddress };
  }
}
