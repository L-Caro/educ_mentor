import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationService } from './invitation.service';

/** Guard global enregistré via APP_GUARD dans app.module.ts.
 * Vérifie que chaque requête API provient d'un appareil invité (cookie access_token valide).
 * Seule exception : /api/auth/invite/:token qui est la route qui POSE le cookie.
 * En dev (ADMIN_PIN_ENABLED=false), le guard est court-circuité pour ne pas bloquer le travail local. */
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const pinEnabled = this.configService.get<boolean>('adminPinEnabled');
    if (!pinEnabled) return true;

    const request = context.switchToHttp().getRequest<{ path: string; cookies: Record<string, string> }>();

    if (request.path.startsWith('/api/auth/invite/')) return true;

    const accessToken = request.cookies?.access_token;
    if (!accessToken) throw new UnauthorizedException('Accès non autorisé');

    const invitation = await this.invitationService.findByToken(accessToken);
    if (!invitation || !invitation.used_at) {
      throw new UnauthorizedException("Token d'accès invalide");
    }

    return true;
  }
}
