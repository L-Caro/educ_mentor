/** Logique métier de l'auth. verifyPin compare le PIN saisi (bcrypt.compare) avec le hash stocké en BDD.
 * Si ADMIN_PIN_ENABLED=false (.env), on court-circuite la vérification : utile en dev pour ne pas taper le PIN.
 * On retourne toujours un JWT signé : c'est ce token que le frontend stocke et renvoie dans chaque requête admin. */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly settingsService: SettingsService,
    private readonly configService: ConfigService,
  ) {}

  async verifyPin(pin: string): Promise<{ token: string }> {
    const pinEnabled = this.configService.get<boolean>('adminPinEnabled');

    // En dev, le PIN est désactivé : on retourne un token sans vérification
    if (!pinEnabled) {
      const token = this.jwtService.sign({ sub: 'admin', role: 'admin' });
      return { token };
    }

    const hash = await this.settingsService.get('admin_pin_hash');
    if (!hash) throw new UnauthorizedException('PIN non configuré');

    const valid = await bcrypt.compare(pin, hash);
    if (!valid) throw new UnauthorizedException('PIN incorrect');

    const token = this.jwtService.sign({ sub: 'admin', role: 'admin' });
    return { token };
  }

  async changePin(currentPin: string, newPin: string): Promise<void> {
    // Vérifier le PIN actuel (même en mode dev)
    const hash = await this.settingsService.get('admin_pin_hash');
    if (hash) {
      const valid = await bcrypt.compare(currentPin, hash);
      if (!valid) throw new UnauthorizedException('PIN actuel incorrect');
    }

    const newHash = await bcrypt.hash(newPin, 10);
    await this.settingsService.set('admin_pin_hash', newHash);
  }
}
