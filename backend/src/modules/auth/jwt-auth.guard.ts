/** Guard qui protège les routes admin. canActivate est appelé avant chaque requête sur une route @UseGuards(JwtAuthGuard).
 * Si ADMIN_PIN_ENABLED=false, on laisse passer sans vérifier : mode dev.
 * Sinon, on délègue à AuthGuard('jwt') qui vérifie le token via JwtStrategy (voir jwt.strategy.ts). */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // En dev, si le PIN est désactivé, toutes les routes protégées sont accessibles
    const pinEnabled = this.configService.get<boolean>('adminPinEnabled');
    if (!pinEnabled) {
      return true;
    }
    return super.canActivate(context);
  }
}
