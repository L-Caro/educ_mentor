import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { MonnaieService } from './monnaie.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('monnaie')
@UseGuards(JwtAuthGuard)
export class MonnaieAdminController {
  constructor(private readonly monnaieService: MonnaieService) {}

  @Get('progression')
  getProgression() {
    return this.monnaieService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.monnaieService.resetProgression();
  }

  @Get('sessions')
  getSessions() {
    return this.monnaieService.getRecentSessions();
  }
}
