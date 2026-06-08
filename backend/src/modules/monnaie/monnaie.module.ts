import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonnaieSession } from './entities/monnaie-session.entity';
import { MonnaieProgression } from './entities/monnaie-progression.entity';
import { MonnaieService } from './monnaie.service';
import { MonnaieGameController } from './monnaie-game.controller';
import { MonnaieAdminController } from './monnaie-admin.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MonnaieSession, MonnaieProgression]),
    SettingsModule,
  ],
  controllers: [MonnaieGameController, MonnaieAdminController],
  providers: [MonnaieService],
})
export class MonnaieModule {}
