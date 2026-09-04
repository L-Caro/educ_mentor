import { Body, Controller, Param, Post } from '@nestjs/common';
import { GeometrieService } from './geometrie.service';
import {
  CompleteGeometrieSessionDto,
  RecordGeometrieAnswerDto,
  StartGeometrieSessionDto,
} from './dto/geometrie.dto';

@Controller('geometrie')
export class GeometrieGameController {
  constructor(private readonly geometrieService: GeometrieService) {}

  @Post('session')
  startSession(@Body() dto: StartGeometrieSessionDto) {
    return this.geometrieService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(
    @Param('id') _id: string,
    @Body() dto: RecordGeometrieAnswerDto,
  ) {
    return this.geometrieService.recordAnswer(dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteGeometrieSessionDto,
  ) {
    return this.geometrieService.completeSession(id, dto);
  }
}
