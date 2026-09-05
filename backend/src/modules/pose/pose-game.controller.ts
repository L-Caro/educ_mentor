import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PoseService } from './pose.service';
import {
  CompletePoseSessionDto,
  RecordPoseAnswerDto,
  StartPoseSessionDto,
} from './dto/pose.dto';

@Controller('pose')
export class PoseGameController {
  constructor(private readonly poseService: PoseService) {}

  /** Les opérations ACTIVES, pour le pré-jeu. Les coder en dur côté front laisserait
   * cocher une opération fermée : la case serait filtrée par le service, et la partie
   * servirait autre chose que ce qui a été demandé. */
  @Get('operations')
  getOperationsOuvertes() {
    return this.poseService.getOperationsOuvertes();
  }

  @Post('session')
  startSession(@Body() dto: StartPoseSessionDto) {
    return this.poseService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') _id: string, @Body() dto: RecordPoseAnswerDto) {
    return this.poseService.recordAnswer(dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompletePoseSessionDto,
  ) {
    return this.poseService.completeSession(id, dto);
  }
}
