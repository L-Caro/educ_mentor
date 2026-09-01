import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DicteeItem } from './entities/dictee-item.entity';
import { DicteeSession } from './entities/dictee-session.entity';
import { DicteeWordStat } from './entities/dictee-word-stat.entity';
import { DicteeService } from './dictee.service';
import { DicteeImportService } from './dictee-import.service';
import { DicteeAdminController } from './dictee-admin.controller';
import { DicteeGameController } from './dictee-game.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DicteeItem, DicteeSession, DicteeWordStat]),
    AuthModule,
  ],
  providers: [DicteeService, DicteeImportService],
  controllers: [DicteeGameController, DicteeAdminController],
})
export class DicteeModule {}
