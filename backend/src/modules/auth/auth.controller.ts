import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, Length } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class VerifyPinDto {
  @IsString()
  @Length(4, 8)
  pin: string;
}

class ChangePinDto {
  @IsString()
  @Length(4, 8)
  currentPin: string;

  @IsString()
  @Length(4, 8)
  newPin: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Vérifie que l'appareil est autorisé (cookie access_token valide via AccessGuard global).
   * Retourne 200 si autorisé, 401 sinon. Utilisé par le frontend au démarrage. */
  @Get('check')
  check() {
    return { ok: true };
  }

  @Post('verify-pin')
  verifyPin(@Body() dto: VerifyPinDto) {
    return this.authService.verifyPin(dto.pin);
  }

  @Post('change-pin')
  @UseGuards(JwtAuthGuard)
  changePin(@Body() dto: ChangePinDto) {
    return this.authService.changePin(dto.currentPin, dto.newPin);
  }
}
