/** Module d'authentification. PassportModule gère la stratégie JWT (voir jwt.strategy.ts).
 * JwtModule signe et vérifie les tokens (secret depuis .env, durée 8h).
 * JwtAuthGuard est exporté pour que les autres modules puissent protéger leurs routes avec @UseGuards(JwtAuthGuard). */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PinAttemptGuard } from './pin-attempt.guard';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    SettingsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwtSecret'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, PinAttemptGuard],
  controllers: [AuthController],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
