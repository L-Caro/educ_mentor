import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { ConjugaisonService } from './conjugaison.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('conjugaison')
@UseGuards(JwtAuthGuard)
export class ConjugaisonAdminController {
  constructor(private readonly conjugaisonService: ConjugaisonService) {}

  @Get('verbs')
  getVerbs() {
    return this.conjugaisonService.getAvailableVerbs();
  }

  @Get('progression')
  getProgression() {
    return this.conjugaisonService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.conjugaisonService.resetProgression();
  }

  @Get('sessions')
  getSessions() {
    return this.conjugaisonService.getRecentSessions();
  }
}