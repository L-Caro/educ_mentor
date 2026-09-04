import { Body, Controller, Param, Post } from '@nestjs/common';
import { GrammaireService } from './grammaire.service';
import {
  CompleteGrammaireSessionDto,
  RecordGrammaireAnswerDto,
  StartGrammaireSessionDto,
} from './dto/grammaire.dto';

@Controller('grammaire')
export class GrammaireGameController {
  constructor(private readonly grammaireService: GrammaireService) {}

  @Post('session')
  startSession(@Body() dto: StartGrammaireSessionDto) {
    return this.grammaireService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(
    @Param('id') _id: string,
    @Body() dto: RecordGrammaireAnswerDto,
  ) {
    return this.grammaireService.recordAnswer(dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteGrammaireSessionDto,
  ) {
    return this.grammaireService.completeSession(id, dto);
  }
}
