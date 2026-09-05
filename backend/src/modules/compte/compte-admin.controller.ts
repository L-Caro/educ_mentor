import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CompteService } from './compte.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateActiveCompteOperationsDto } from './dto/compte.dto';

@Controller('compte')
@UseGuards(JwtAuthGuard)
export class CompteAdminController {
  constructor(private readonly compteService: CompteService) {}

  @Get('progression')
  getProgression() {
    return this.compteService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.compteService.resetProgression();
  }

  /** Le catalogue COMPLET, ouvertes comme fermées : l'administration doit voir les
   * fermées, sinon il n'y a rien à ouvrir. */
  @Get('operations-catalogue')
  getOperations() {
    return this.compteService.getOperations();
  }

  @Get('operations-actives')
  getActiveOperations() {
    return this.compteService.getActiveOperations();
  }

  @Patch('operations-actives')
  setActiveOperations(@Body() dto: UpdateActiveCompteOperationsDto) {
    return this.compteService.setActiveOperations(dto.keys);
  }
}
