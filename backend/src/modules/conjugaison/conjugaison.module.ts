import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConjugaisonSession } from './entities/conjugaison-session.entity';
import { ConjugaisonProgression } from './entities/conjugaison-progression.entity';
import { ConjugaisonService } from './conjugaison.service';
import { ConjugaisonGameController } from './conjugaison-game.controller';
import { ConjugaisonAdminController } from './conjugaison-admin.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConjugaisonSession, ConjugaisonProgression]),
    SettingsModule,
  ],
  controllers: [ConjugaisonGameController, ConjugaisonAdminController],
  providers: [ConjugaisonService],
})
export class ConjugaisonModule {}