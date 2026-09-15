import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgrammationProgression } from './entities/programmation-progression.entity';
import { ProgrammationService } from './programmation.service';
import { ProgrammationGameController } from './programmation-game.controller';

/** Aucune table de CONTENU : les niveaux sont engendres a la demande cote navigateur,
 * comme les tirages du compte est bon le sont cote serveur. Stocker des niveaux
 * n'apporterait qu'un moyen d'en enregistrer d'insolubles. */
@Module({
  imports: [TypeOrmModule.forFeature([ProgrammationProgression])],
  controllers: [ProgrammationGameController],
  providers: [ProgrammationService],
  exports: [ProgrammationService],
})
export class ProgrammationModule {}
