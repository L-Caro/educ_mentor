import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { PoseService } from './pose.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('pose')
@UseGuards(JwtAuthGuard)
export class PoseAdminController {
  constructor(private readonly poseService: PoseService) {}

  @Get('progression')
  getProgression() {
    return this.poseService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.poseService.resetProgression();
  }
}
