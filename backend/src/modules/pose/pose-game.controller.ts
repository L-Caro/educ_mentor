import { Body, Controller, Param, Post } from '@nestjs/common';
import { PoseService } from './pose.service';
import {
  CompletePoseSessionDto,
  RecordPoseAnswerDto,
  StartPoseSessionDto,
} from './dto/pose.dto';

@Controller('pose')
export class PoseGameController {
  constructor(private readonly poseService: PoseService) {}

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
