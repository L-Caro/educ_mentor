import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LectureService } from './lecture.service';
import {
  CompleteLectureSessionDto,
  RecordLectureAnswerDto,
  StartLectureSessionDto,
} from './dto/lecture.dto';

@Controller('lecture')
export class LectureGameController {
  constructor(private readonly service: LectureService) {}

  @Get('texts')
  getTexts() {
    return this.service.getActiveTexts();
  }

  @Post('session')
  startSession(@Body() dto: StartLectureSessionDto) {
    return this.service.createSession(dto);
  }

  @Post('session/:id/answer')
  async recordAnswer(
    @Param('id') id: string,
    @Body() dto: RecordLectureAnswerDto,
  ) {
    await this.service.recordAnswer(id, dto.itemKey, dto.isCorrect);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteLectureSessionDto,
  ) {
    return this.service.completeSession(id, dto);
  }
}
