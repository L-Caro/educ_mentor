import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsNumberString, IsString, Length } from 'class-validator';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PinAttemptGuard } from './pin-attempt.guard';

class VerifyPinDto {
  @IsString()
  @IsNumberString(
    { no_symbols: true },
    { message: 'Le code PIN ne contient que des chiffres.' },
  )
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
  constructor(
    private readonly authService: AuthService,
    private readonly pinAttemptGuard: PinAttemptGuard,
  ) {}

  /** Vérifie que l'appareil est autorisé (cookie access_token valide via AccessGuard global).
   * Retourne 200 si autorisé, 401 sinon. Utilisé par le frontend au démarrage. */
  @Get('check')
  check() {
    return { ok: true };
  }

  /** Protégée par PinAttemptGuard : sans limite, un PIN à 4 chiffres s'énumère en secondes. */
  @Post('verify-pin')
  @UseGuards(PinAttemptGuard)
  async verifyPin(@Body() dto: VerifyPinDto, @Req() request: Request) {
    const result = await this.authService.verifyPin(dto.pin);
    // Saisie correcte : on rend son quota à l'appareil, pour ne pas pénaliser un parent
    // qui s'est trompé plusieurs fois avant de réussir.
    this.pinAttemptGuard.clear(request.ip);
    return result;
  }

  @Post('change-pin')
  @UseGuards(JwtAuthGuard)
  changePin(@Body() dto: ChangePinDto) {
    return this.authService.changePin(dto.currentPin, dto.newPin);
  }
}
