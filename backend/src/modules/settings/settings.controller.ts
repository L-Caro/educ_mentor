import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { SettingsService, isPrivateKey } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString } from 'class-validator';

class UpdateSettingDto {
  @IsString()
  value: string;
}

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getAll() {
    // Volontairement `getPublic` : cette route n'est pas protégée — le frontend enfant en a
    // besoin — elle ne doit donc jamais renvoyer de secret.
    return this.settingsService.getPublic();
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard)
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    // Renvoyer une erreur métier avec un statut 200 laissait le client croire au succès.
    if (isPrivateKey(key)) {
      throw new ForbiddenException(
        `Le réglage « ${key} » n'est pas modifiable par cette route.`,
      );
    }
    return this.settingsService.set(key, dto.value);
  }
}
