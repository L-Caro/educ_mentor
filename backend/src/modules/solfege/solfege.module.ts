import { Module } from '@nestjs/common';
import { SolfegeService } from './solfege.service';

/**
 * Aucune entité, aucun contrôleur, aucune migration.
 *
 * Le jeu se joue entièrement dans le navigateur : rien à enregistrer ici. Ce module
 * n'existe que pour la feuille imprimée, qui se compose côté serveur comme celle de tous
 * les autres modules.
 */
@Module({
  providers: [SolfegeService],
  exports: [SolfegeService],
})
export class SolfegeModule {}
