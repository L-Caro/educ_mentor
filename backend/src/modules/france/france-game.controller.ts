import { Body, Controller, Param, Post } from '@nestjs/common';
import { FranceService } from './france.service';
import { StartFranceSessionDto, RecordFranceAnswerDto, CompleteFranceSessionDto } from './dto/france.dto';

@Controller('france')
export class FranceGameController {
  constructor(private readonly franceService: FranceService) {}

  @Post('session')
  startSession(@Body() dto: StartFranceSessionDto) {
    return this.franceService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordFranceAnswerDto) {
    return this.franceService.recordAnswer(id, dto);
  }

  @Post('session/:id/complete')
  completeSession(@Param('id') id: string, @Body() dto: CompleteFranceSessionDto) {
    return this.franceService.completeSession(id, dto.correct_answers, dto.total_questions);
  }
}
