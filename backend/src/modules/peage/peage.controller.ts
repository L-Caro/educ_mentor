import { Controller, Get } from '@nestjs/common';
import { PeageService } from './peage.service';

/** Route NON protégée : c'est le frontend enfant qui la lit, avant chaque partie. */
@Controller('peage')
export class PeageController {
  constructor(private readonly peageService: PeageService) {}

  /** Le péage tel qu'il s'applique maintenant : combien de questions, et lesquels des
   * cinq modules peuvent en fournir. Le front s'en sert pour NE PAS afficher de péage
   * quand il n'y en a pas — plutôt que de demander une question pour découvrir qu'il n'y
   * en a pas. */
  @Get()
  async etat() {
    return {
      questions: await this.peageService.nombreDeQuestions(),
      modules: await this.peageService.modulesDisponibles(),
    };
  }

  /** Une question, ou `null`. `null` n'est pas une erreur : il veut dire « laisse-la
   * jouer » — voir `PeageService.tirerQuestion`. */
  @Get('question')
  async question() {
    return { question: await this.peageService.tirerQuestion() };
  }
}
