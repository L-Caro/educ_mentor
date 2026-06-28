import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { FranceService } from './france.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('france')
@UseGuards(JwtAuthGuard)
export class FranceAdminController {
  constructor(private readonly franceService: FranceService) {}

  @Get('regions')
  getRegions() {
    return this.franceService.getRegions();
  }

  @Get('departements')
  getDepartements() {
    return this.franceService.getDepartements();
  }

  @Get('progression')
  getProgression() {
    return this.franceService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.franceService.resetProgression();
  }

  @Get('sessions')
  getSessions() {
    return this.franceService.getRecentSessions();
  }
}
