import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { GeoService } from './geo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('geo')
@UseGuards(JwtAuthGuard)
export class GeoAdminController {
  constructor(private readonly geoService: GeoService) {}

  @Get('countries')
  getCountries() {
    return this.geoService.getAllCountries();
  }

  @Get('progression')
  getProgression() {
    return this.geoService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.geoService.resetProgression();
  }

  @Get('sessions')
  getSessions() {
    return this.geoService.getRecentSessions();
  }
}
