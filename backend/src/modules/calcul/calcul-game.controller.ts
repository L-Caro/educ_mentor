import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CalculService } from './calcul.service';
import {
  RecordCalculAnswerDto,
  CompleteCalculSessionDto,
  StartCalculSessionDto,
} from './dto/calcul.dto';

@Controller('calcul')
export class CalculGameController {
  constructor(private readonly calculService: CalculService) {}

  /** Les types de calcul ACTIFS, pour le pré-jeu. Les coder en dur côté front laisserait
   * un CE1 cocher « division » : la case serait ensuite filtrée par le service, et la
   * partie servirait autre chose que ce qui a été demandé. */
  @Get('types')
  getTypesOuverts() {
    return this.calculService.getTypesOuverts();
  }

  @Post('session')
  startSession(@Body() dto: StartCalculSessionDto) {
    return this.calculService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordCalculAnswerDto) {
    return this.calculService.recordAnswer(id, dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteCalculSessionDto,
  ) {
    return this.calculService.completeSession(
      id,
      dto.correct_answers,
      dto.total_questions,
    );
  }
}
