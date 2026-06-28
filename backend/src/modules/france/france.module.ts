import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FranceSession } from './entities/france-session.entity';
import { FranceProgression } from './entities/france-progression.entity';
import { FranceService } from './france.service';
import { FranceGameController } from './france-game.controller';
import { FranceAdminController } from './france-admin.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FranceSession, FranceProgression]),
    SettingsModule,
  ],
  controllers: [FranceGameController, FranceAdminController],
  providers: [FranceService],
})
export class FranceModule {}
