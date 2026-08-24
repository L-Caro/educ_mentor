import { Body, Controller, Param, Post } from '@nestjs/common';
import { HeureService } from './heure.service';
import {
  StartHeureSessionDto,
  RecordHeureAnswerDto,
  CompleteHeureSessionDto,
} from './dto/heure.dto';

@Controller('heure')
export class HeureGameController {
  constructor(private readonly heureService: HeureService) {}

  @Post('session')
  startSession(@Body() dto: StartHeureSessionDto) {
    return this.heureService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordHeureAnswerDto) {
    return this.heureService.recordAnswer(id, dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteHeureSessionDto,
  ) {
    return this.heureService.completeSession(
      id,
      dto.correct_answers,
      dto.total_questions,
    );
  }
}
