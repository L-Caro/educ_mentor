import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { GeometrieService } from './geometrie.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateActiveShapesDto } from './dto/geometrie.dto';

@Controller('geometrie')
@UseGuards(JwtAuthGuard)
export class GeometrieAdminController {
  constructor(private readonly geometrieService: GeometrieService) {}

  // ─── Catalogue et figures actives ────────────────────────────────────────

  @Get('shapes')
  getShapes() {
    return this.geometrieService.getShapes();
  }

  @Get('figures-actives')
  getActiveShapes() {
    return this.geometrieService.getActiveShapeKeys();
  }

  @Patch('figures-actives')
  setActiveShapes(@Body() dto: UpdateActiveShapesDto) {
    return this.geometrieService.setActiveShapeKeys(dto.keys);
  }

  // ─── Progression ──────────────────────────────────────────────────────────

  @Get('progression')
  getProgression() {
    return this.geometrieService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.geometrieService.resetProgression();
  }
}
