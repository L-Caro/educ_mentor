import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { CalculService } from './calcul.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('calcul')
export class CalculAdminController {
  constructor(private readonly calculService: CalculService) {}

  @Get('progression')
  @UseGuards(JwtAuthGuard)
  getProgression() {
    return this.calculService.getProgression();
  }

  @Delete('progression')
  @UseGuards(JwtAuthGuard)
  resetProgression() {
    return this.calculService.resetProgression();
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  getSessions() {
    return this.calculService.getRecentSessions();
  }
}
