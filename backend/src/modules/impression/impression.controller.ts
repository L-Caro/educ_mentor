import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ImpressionService } from './impression.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ComposerFeuilleDto } from './dto/impression.dto';

/**
 * Route PROTEGEE, contrairement a celles du jeu. Imprimer est une action de parent : il
 * faut une imprimante, du papier, et decider de ce qu'on fait travailler. L'enfant n'a
 * rien a faire ici, et le corrige y circule.
 */
@Controller('impression')
@UseGuards(JwtAuthGuard)
export class ImpressionController {
  constructor(private readonly impressionService: ImpressionService) {}

  @Post('feuille')
  composer(@Body() dto: ComposerFeuilleDto) {
    return this.impressionService.composer(dto.lignes);
  }
}
