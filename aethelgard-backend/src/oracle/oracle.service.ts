import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';

@Injectable()
export class OracleService {
  private readonly logger = new Logger(OracleService.name);

  constructor(
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    private readonly config: ConfigService,
  ) {}

  @Cron('0 */15 * * * *')
  async calculateAndCreditEssence() {
    if (!this.config.get<boolean>('ORACLE_CRON_ENABLED')) {
      this.logger.verbose('ORACLE_CRON_ENABLED=false; saltando ciclo');
      return;
    }
    const users = await this.userRepo.find();
    if (!users.length) return;

    const rate = Number(this.config.get<string>('ESSENCE_RATE_PER_SECOND'));
    const rpc = this.config.get<string>('CORE_RPC_URL')!;
    const provider = new ethers.JsonRpcProvider(rpc);

    // TODO: Reemplazar por contratos reales de CoreDAO. Aquí usamos mocks de lectura para ilustrar
    const stakeBalanceOf = async (_address: string) => {
      return ethers.parseEther('1');
    };

    const updates: { user: string; amount: bigint }[] = [];
    const now = Math.floor(Date.now() / 1000);
    for (const u of users) {
      const staked = await stakeBalanceOf(u.walletAddress);
      // En producción persistirías lastChecked por usuario para delta real; aquí un ejemplo simple 15 min
      const seconds = 15 * 60;
      const rewardFloat = Number(ethers.formatEther(staked)) * rate * seconds;
      const rewardWei = ethers.parseEther(rewardFloat.toFixed(18));
      updates.push({ user: u.walletAddress, amount: rewardWei });
    }

    if (!updates.length) return;

    // Llamada en lote al contrato StakingOracle
    const updaterKey = this.config.get<string>('ORACLE_UPDATER_PRIVATE_KEY')!;
    const oracleAddress = this.config.get<string>('STAKING_ORACLE_CONTRACT_ADDRESS')!;
    const wallet = new ethers.Wallet(updaterKey, provider);
    const oracleAbi = [
      'function updateEssenceBalance(address[] users, uint256[] amounts) external'
    ];
    const contract = new ethers.Contract(oracleAddress, oracleAbi, wallet);

    const addresses = updates.map(u => u.user);
    const amounts = updates.map(u => u.amount);

    if (this.config.get<boolean>('ORACLE_DRY_RUN')) {
      this.logger.log(`DRY_RUN activo. No se envía transacción. Updates: ${updates.length}`);
      return;
    }

    try {
      const tx = await contract.updateEssenceBalance(addresses, amounts);
      this.logger.log(`TX enviada: ${tx.hash}`);
      const receipt = await tx.wait();
      this.logger.log(`TX minada en bloque ${receipt.blockNumber}`);
    } catch (err) {
      this.logger.error('Error actualizando balances de Essence', err as Error);
    }
  }
}
