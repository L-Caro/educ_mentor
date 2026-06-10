import { Body, Controller, Param, Post } from '@nestjs/common';
import { CalculService } from './calcul.service';
import { RecordCalculAnswerDto, CompleteCalculSessionDto, StartCalculSessionDto } from './dto/calcul.dto';

@Controller('calcul')
export class CalculGameController {
  constructor(private readonly calculService: CalculService) {}

  @Post('session')
  startSession(@Body() dto: StartCalculSessionDto) {
    return this.calculService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordCalculAnswerDto) {
    return this.calculService.recordAnswer(id, dto);
  }

  @Post('session/:id/complete')
  completeSession(@Param('id') id: string, @Body() dto: CompleteCalculSessionDto) {
    return this.calculService.completeSession(id, dto.correct_answers, dto.total_questions);
  }
}
