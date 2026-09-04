import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccordsSession } from './entities/accords-session.entity';
import { AccordsProgression } from './entities/accords-progression.entity';
import { AccordsService } from './accords.service';
import { AccordsGameController } from './accords-game.controller';
import { AccordsAdminController } from './accords-admin.controller';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccordsSession, AccordsProgression]),
    AuthModule,
    SettingsModule,
  ],
  providers: [AccordsService],
  controllers: [AccordsGameController, AccordsAdminController],
})
export class AccordsModule {}
