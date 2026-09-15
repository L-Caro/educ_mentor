import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProgrammationService } from './programmation.service';
import { ReussiteDto } from './dto/programmation.dto';

/**
 * Route de JEU, donc ouverte : c'est l'enfant qui joue, et elle n'est pas authentifiee.
 * Comme pour les autres modules, ce qui transite ici ne dit rien de plus que ce qu'elle
 * a sous les yeux.
 */
@Controller('programmation')
export class ProgrammationGameController {
  constructor(private readonly service: ProgrammationService) {}

  @Get('etat')
  getEtat() {
    return this.service.getEtat();
  }

  @Post('reussite')
  enregistrer(@Body() dto: ReussiteDto) {
    return this.service.enregistrerReussite(dto.parcours, dto.etape);
  }
}
