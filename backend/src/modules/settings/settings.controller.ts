import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
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
    return this.settingsService.getAll();
  }

  @Patch(':key')
  @UseGuards(JwtAuthGuard)
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    // Empêcher la modification du PIN via cette route générique
    if (key === 'admin_pin_hash') {
      return { error: 'Utiliser /api/auth/change-pin pour modifier le PIN' };
    }
    return this.settingsService.set(key, dto.value);
  }
}
