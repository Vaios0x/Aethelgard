import { Module } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([UserEntity])],
  providers: [OracleService]
})
export class OracleModule {}
