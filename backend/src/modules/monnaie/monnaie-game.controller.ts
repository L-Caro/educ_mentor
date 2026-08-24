import { Body, Controller, Param, Post } from '@nestjs/common';
import { MonnaieService } from './monnaie.service';
import {
  StartMonnaieSessionDto,
  RecordMonnaieAnswerDto,
  CompleteMonnaieSessionDto,
} from './dto/monnaie.dto';

@Controller('monnaie')
export class MonnaieGameController {
  constructor(private readonly monnaieService: MonnaieService) {}

  @Post('session')
  startSession(@Body() dto: StartMonnaieSessionDto) {
    return this.monnaieService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordMonnaieAnswerDto) {
    return this.monnaieService.recordAnswer(id, dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteMonnaieSessionDto,
  ) {
    return this.monnaieService.completeSession(
      id,
      dto.correct_answers,
      dto.total_questions,
    );
  }
}
