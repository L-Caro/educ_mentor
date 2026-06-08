import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ImagierService } from './imagier.service';
import {
  StartSessionDto,
  RecordAnswerDto,
  CompleteSessionDto,
} from './dto/imagier.dto';

@Controller('imagier/session')
export class ImagierGameController {
  constructor(private readonly imagierService: ImagierService) {}

  @Get()
  startSession(@Query() dto: StartSessionDto) {
    return this.imagierService.startSession(dto);
  }

  @Post(':id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordAnswerDto) {
    return this.imagierService.recordAnswer(id, dto.word_id, dto.is_correct);
  }

  @Post(':id/complete')
  completeSession(@Param('id') id: string, @Body() dto: CompleteSessionDto) {
    return this.imagierService.completeSession(
      id,
      dto.correct_answers,
      dto.total_questions,
    );
  }
}
