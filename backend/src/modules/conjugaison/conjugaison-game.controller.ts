import { Body, Controller, Param, Post } from '@nestjs/common';
import { ConjugaisonService } from './conjugaison.service';
import { StartConjugaisonSessionDto, RecordConjugaisonAnswerDto, CompleteConjugaisonSessionDto } from './dto/conjugaison.dto';

@Controller('conjugaison')
export class ConjugaisonGameController {
  constructor(private readonly conjugaisonService: ConjugaisonService) {}

  @Post('session')
  startSession(@Body() dto: StartConjugaisonSessionDto) {
    return this.conjugaisonService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordConjugaisonAnswerDto) {
    return this.conjugaisonService.recordAnswer(id, dto);
  }

  @Post('session/:id/complete')
  completeSession(@Param('id') id: string, @Body() dto: CompleteConjugaisonSessionDto) {
    return this.conjugaisonService.completeSession(id, dto.correct_answers, dto.total_questions);
  }
}