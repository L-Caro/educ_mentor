import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ConjugaisonService } from './conjugaison.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateActiveTensesDto } from './dto/conjugaison.dto';

@Controller('conjugaison')
@UseGuards(JwtAuthGuard)
export class ConjugaisonAdminController {
  constructor(private readonly conjugaisonService: ConjugaisonService) {}

  /** Le catalogue COMPLET : tous les temps du CP au CM2, avec leur classe. L'admin doit
   * voir les fermés, sinon il n'y a rien à ouvrir. */
  @Get('temps-catalogue')
  getTenses() {
    return this.conjugaisonService.getTenses();
  }

  @Get('temps-actifs')
  getActiveTenses() {
    return this.conjugaisonService.getActiveTenseKeys();
  }

  @Patch('temps-actifs')
  setActiveTenses(@Body() dto: UpdateActiveTensesDto) {
    return this.conjugaisonService.setActiveTenseKeys(dto.keys);
  }

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
