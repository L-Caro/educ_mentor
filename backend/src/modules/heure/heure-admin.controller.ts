import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { HeureService } from './heure.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('heure')
@UseGuards(JwtAuthGuard)
export class HeureAdminController {
  constructor(private readonly heureService: HeureService) {}

  @Get('progression')
  getProgression() {
    return this.heureService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.heureService.resetProgression();
  }

  @Get('sessions')
  getSessions() {
    return this.heureService.getRecentSessions();
  }
}
