import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { GrammaireService } from './grammaire.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateActiveNotionsDto } from './dto/grammaire.dto';

@Controller('grammaire')
@UseGuards(JwtAuthGuard)
export class GrammaireAdminController {
  constructor(private readonly grammaireService: GrammaireService) {}

  // ─── Catalogue et notions actives ─────────────────────────────────────────

  @Get('notions')
  getNotions() {
    return this.grammaireService.getNotions();
  }

  @Get('notions-actives')
  getActiveNotions() {
    return this.grammaireService.getActiveNotionKeys();
  }

  @Patch('notions-actives')
  setActiveNotions(@Body() dto: UpdateActiveNotionsDto) {
    return this.grammaireService.setActiveNotionKeys(dto.keys);
  }

  // ─── Progression ──────────────────────────────────────────────────────────

  @Get('progression')
  getProgression() {
    return this.grammaireService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.grammaireService.resetProgression();
  }
}
