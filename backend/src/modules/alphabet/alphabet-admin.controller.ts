import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlphabetService } from './alphabet.service';
import { ExclureMotDto } from './dto/alphabet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/** Le referentiel se regle ici, et nulle part ailleurs : c'est une decision d'adulte. */
@Controller('alphabet')
@UseGuards(JwtAuthGuard)
export class AlphabetAdminController {
  constructor(private readonly service: AlphabetService) {}

  @Get('etat')
  etat() {
    return this.service.etat();
  }

  /** La recherche rend au plus quarante mots : le referentiel entier ne descend jamais
   * dans le navigateur. */
  @Get('chercher')
  chercher(@Query('terme') terme?: string) {
    return this.service.chercher(terme ?? '');
  }

  @Get('exclus')
  exclus() {
    return this.service.listerExclus();
  }

  @Post('exclus')
  exclure(@Body() dto: ExclureMotDto) {
    return this.service.exclure(dto.mot);
  }

  @Delete('exclus')
  reintegrer(@Body() dto: ExclureMotDto) {
    return this.service.reintegrer(dto.mot);
  }
}
