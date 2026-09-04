import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AccordsService } from './accords.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateActiveNotionsDto } from './dto/accords.dto';

@Controller('accords')
@UseGuards(JwtAuthGuard)
export class AccordsAdminController {
  constructor(private readonly accordsService: AccordsService) {}

  // ─── Catalogue et notions actives ─────────────────────────────────────────

  @Get('notions')
  getNotions() {
    return this.accordsService.getNotions();
  }

  @Get('notions-actives')
  getActiveNotions() {
    return this.accordsService.getActiveNotionKeys();
  }

  @Patch('notions-actives')
  setActiveNotions(@Body() dto: UpdateActiveNotionsDto) {
    return this.accordsService.setActiveNotionKeys(dto.keys);
  }

  // ─── Progression ──────────────────────────────────────────────────────────

  @Get('progression')
  getProgression() {
    return this.accordsService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.accordsService.resetProgression();
  }
}
