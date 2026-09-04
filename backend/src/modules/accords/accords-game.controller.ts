import { Body, Controller, Param, Post } from '@nestjs/common';
import { AccordsService } from './accords.service';
import {
  CompleteAccordsSessionDto,
  RecordAccordsAnswerDto,
  StartAccordsSessionDto,
} from './dto/accords.dto';

@Controller('accords')
export class AccordsGameController {
  constructor(private readonly accordsService: AccordsService) {}

  @Post('session')
  startSession(@Body() dto: StartAccordsSessionDto) {
    return this.accordsService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') _id: string, @Body() dto: RecordAccordsAnswerDto) {
    return this.accordsService.recordAnswer(dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteAccordsSessionDto,
  ) {
    return this.accordsService.completeSession(id, dto);
  }
}
