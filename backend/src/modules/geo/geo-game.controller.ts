import { Body, Controller, Param, Post } from '@nestjs/common';
import { GeoService } from './geo.service';
import {
  StartGeoSessionDto,
  RecordGeoAnswerDto,
  CompleteGeoSessionDto,
} from './dto/geo.dto';

@Controller('geo')
export class GeoGameController {
  constructor(private readonly geoService: GeoService) {}

  @Post('session')
  startSession(@Body() dto: StartGeoSessionDto) {
    return this.geoService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordGeoAnswerDto) {
    return this.geoService.recordAnswer(id, dto);
  }

  @Post('session/:id/complete')
  completeSession(@Param('id') id: string, @Body() dto: CompleteGeoSessionDto) {
    return this.geoService.completeSession(
      id,
      dto.correct_answers,
      dto.total_questions,
    );
  }
}
