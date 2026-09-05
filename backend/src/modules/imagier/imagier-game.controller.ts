import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ImagierService } from './imagier.service';
import {
  StartSessionDto,
  RecordAnswerDto,
  CompleteSessionDto,
} from './dto/imagier.dto';

/** Routes accessibles sans authentification admin : lancées par l'enfant pendant une partie
 * (session de jeu + liste des catégories nécessaire au pré-jeu). Ne pas ajouter @UseGuards(JwtAuthGuard)
 * ici : ces routes doivent rester ouvertes à tout appareil autorisé (cf. AccessGuard global). */
@Controller('imagier')
export class ImagierGameController {
  constructor(private readonly imagierService: ImagierService) {}

  @Get('categories')
  getCategories() {
    return this.imagierService.getCategories();
  }

  @Post('session')
  startSession(@Body() dto: StartSessionDto) {
    return this.imagierService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordAnswerDto) {
    return this.imagierService.recordAnswer(id, dto.word_id, dto.is_correct);
  }

  @Post('session/:id/complete')
  completeSession(@Param('id') id: string, @Body() dto: CompleteSessionDto) {
    return this.imagierService.completeSession(
      id,
      dto.correct_answers,
      dto.total_questions,
    );
  }
}
