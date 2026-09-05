import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PoseService } from './pose.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateActiveOperationsDto } from './dto/pose.dto';

@Controller('pose')
@UseGuards(JwtAuthGuard)
export class PoseAdminController {
  constructor(private readonly poseService: PoseService) {}

  @Get('progression')
  getProgression() {
    return this.poseService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.poseService.resetProgression();
  }

  /** Le catalogue COMPLET, ouvertes comme fermées : l'administration doit voir les
   * fermées, sinon il n'y a rien à ouvrir. */
  @Get('operations-catalogue')
  getOperations() {
    return this.poseService.getOperations();
  }

  @Get('operations-actives')
  getActiveOperations() {
    return this.poseService.getActiveOperations();
  }

  @Patch('operations-actives')
  setActiveOperations(@Body() dto: UpdateActiveOperationsDto) {
    return this.poseService.setActiveOperations(dto.keys);
  }
}
