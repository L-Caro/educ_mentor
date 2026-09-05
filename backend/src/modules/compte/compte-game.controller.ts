import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CompteService } from './compte.service';
import {
  CompleteCompteSessionDto,
  RecordCompteAnswerDto,
  StartCompteSessionDto,
} from './dto/compte.dto';

@Controller('compte')
export class CompteGameController {
  constructor(private readonly compteService: CompteService) {}

  /** Les opérations ACTIVES, pour le pré-jeu. Les coder en dur côté front laisserait
   * cocher la division avant qu'elle ait été vue en classe : la case serait filtrée par
   * le service, et la partie servirait autre chose que ce qui a été demandé. */
  @Get('operations')
  getOperationsOuvertes() {
    return this.compteService.getOperationsOuvertes();
  }

  @Post('session')
  startSession(@Body() dto: StartCompteSessionDto) {
    return this.compteService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') _id: string, @Body() dto: RecordCompteAnswerDto) {
    return this.compteService.recordAnswer(dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteCompteSessionDto,
  ) {
    return this.compteService.completeSession(id, dto);
  }
}
