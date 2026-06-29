import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { NumerationService } from './numeration.service';
import { CompleteNumerationSessionDto, RecordNumerationAnswerDto, StartNumerationSessionDto } from './dto/numeration.dto';

@Controller('numeration')
export class NumerationGameController {
  constructor(private readonly service: NumerationService) {}

  @Get('progression')
  getProgression() {
    return this.service.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.service.resetProgression();
  }

  @Post('session')
  startSession(@Body() dto: StartNumerationSessionDto) {
    return this.service.createSession(dto);
  }

  @Post('session/:id/answer')
  async recordAnswer(@Param('id') id: string, @Body() dto: RecordNumerationAnswerDto) {
    await this.service.recordAnswer(id, dto.itemKey, dto.isCorrect);
  }

  @Post('session/:id/complete')
  completeSession(@Param('id') id: string, @Body() dto: CompleteNumerationSessionDto) {
    return this.service.completeSession(id, dto);
  }
}