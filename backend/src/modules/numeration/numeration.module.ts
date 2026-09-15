import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NumerationSession } from './entities/numeration-session.entity';
import { NumerationProgression } from './entities/numeration-progression.entity';
import { NumerationService } from './numeration.service';
import { NumerationGameController } from './numeration-game.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NumerationSession, NumerationProgression]),
    SettingsModule,
  ],
  controllers: [NumerationGameController],
  providers: [NumerationService],
  // Exporte pour la feuille imprimee, qui emprunte ses questions sans rien enregistrer.
  exports: [NumerationService],
})
export class NumerationModule {}
