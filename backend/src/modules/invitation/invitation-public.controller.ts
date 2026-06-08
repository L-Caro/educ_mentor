import { Controller, Get, Param, Query, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { InvitationService } from './invitation.service';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class InvitationPublicController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly configService: ConfigService,
  ) {}

  /** Bootstrap admin — exemptée du AccessGuard.
   * Vérifie le token secret (.env ADMIN_BOOTSTRAP_TOKEN), crée une invitation auto-utilisée,
   * pose le cookie access_token. Réutilisable : chaque appel crée une entrée distincte. */
  @Get('admin-access')
  async adminBootstrap(
    @Query('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const bootstrapToken = this.configService.get<string>('adminBootstrapToken');
    if (!bootstrapToken || token !== bootstrapToken) {
      throw new UnauthorizedException('Token invalide');
    }

    const invitation = await this.invitationService.createAndUse('Admin — bootstrap');
    const pinEnabled = this.configService.get<boolean>('adminPinEnabled');
    response.cookie('access_token', invitation.token, {
      httpOnly: true,
      maxAge: ONE_YEAR_MS,
      sameSite: 'lax',
      secure: pinEnabled,
    });

    return { ok: true };
  }

  /** Route publique — exemptée du AccessGuard.
   * Valide le token, pose le cookie access_token (1 an), retourne 200.
   * Le frontend redirige ensuite vers / après réception du 200. */
  @Get('invite/:token')
  async validateInvite(
    @Param('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const invitation = await this.invitationService.findByToken(token);

    if (!invitation) throw new UnauthorizedException('Lien invalide');
    if (invitation.used_at) throw new UnauthorizedException('Lien déjà utilisé');

    await this.invitationService.markAsUsed(invitation.id);

    const pinEnabled = this.configService.get<boolean>('adminPinEnabled');
    response.cookie('access_token', token, {
      httpOnly: true,
      maxAge: ONE_YEAR_MS,
      sameSite: 'lax',
      secure: pinEnabled,
    });

    return { ok: true, label: invitation.label };
  }
}
