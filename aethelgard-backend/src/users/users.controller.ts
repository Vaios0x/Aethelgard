import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../utils/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return { walletAddress: req.user.walletAddress };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/heroes')
  async myHeroes(@Req() req: any, config: ConfigService) {
    const address: string = req.user.walletAddress;
    const rpc = config.get<string>('CORE_RPC_URL')!;
    const provider = new ethers.JsonRpcProvider(rpc);
    const heroAbi = [
      'function balanceOf(address) view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
      'function tokenURI(uint256) view returns (string)'
    ];
    const heroAddress = config.get<string>('HERO_NFT_CONTRACT_ADDRESS')!;
    const hero = new ethers.Contract(heroAddress, heroAbi, provider);

    const balance: bigint = await hero.balanceOf(address);
    const ids: bigint[] = [];
    for (let i = 0n; i < balance; i++) {
      ids.push(await hero.tokenOfOwnerByIndex(address, i));
    }
    const results = await Promise.all(ids.map(async (id) => {
      const uri: string = await hero.tokenURI(id);
      let metadata: any = {};
      try {
        const url = uri.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${uri.replace('ipfs://','')}` : uri;
        const res = await fetch(url);
        metadata = await res.json();
      } catch {}
      return {
        id: id.toString(),
        name: metadata.name ?? `Héroe #${id}`,
        image: metadata.image ?? '',
        level: Number(metadata.level ?? 1),
        class: metadata.class ?? 'Warrior',
        power: Number(metadata.power ?? 0),
        description: metadata.description,
        attributes: metadata.attributes,
      };
    }));
    return { heroes: results };
  }
}
