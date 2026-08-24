import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HeureSession } from './entities/heure-session.entity';
import { HeureProgression } from './entities/heure-progression.entity';
import { HeureService } from './heure.service';
import { HeureGameController } from './heure-game.controller';
import { HeureAdminController } from './heure-admin.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([HeureSession, HeureProgression]),
    SettingsModule,
  ],
  controllers: [HeureGameController, HeureAdminController],
  providers: [HeureService],
})
export class HeureModule {}
