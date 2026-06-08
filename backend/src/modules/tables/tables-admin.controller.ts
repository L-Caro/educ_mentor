import { Controller, Delete, Get, UseGuards } from '@nestjs/common';
import { TablesService } from './tables.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('tables')
@UseGuards(JwtAuthGuard)
export class TablesAdminController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('progression')
  getProgression() {
    return this.tablesService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.tablesService.resetProgression();
  }
}
