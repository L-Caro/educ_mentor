import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Limite les tentatives de saisie du code PIN, par adresse IP.
 *
 * Pourquoi : le PIN fait 4 à 8 chiffres et `verify-pin` n'était pas limitée. Un appareil
 * disposant d'une invitation valide pouvait énumérer les 10 000 combinaisons d'un PIN à
 * 4 chiffres en quelques secondes.
 *
 * Pourquoi par IP et non globalement : un compteur global permettrait à un invité de
 * verrouiller l'accès administrateur du parent en épuisant volontairement les essais.
 * Le blocage reste donc cantonné à l'appareil qui se trompe.
 *
 * Pourquoi en mémoire et non `@nestjs/throttler` : l'application tourne en instance unique.
 * Un compteur en mémoire suffit, ne dépend de rien, et se réinitialise au redémarrage —
 * ce qui est acceptable ici. Ce choix serait faux derrière plusieurs répliques.
 */

const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
/** Purge : sans elle, la table grossirait indéfiniment au fil des IP rencontrées. */
const SWEEP_EVERY = 200;

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
}

@Injectable()
export class PinAttemptGuard implements CanActivate {
  private readonly attempts = new Map<string, AttemptRecord>();
  private requestsSinceSweep = 0;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? 'inconnu';
    const now = Date.now();

    this.maybeSweep(now);

    const record = this.attempts.get(key);

    if (!record || now - record.firstAttemptAt > WINDOW_MS) {
      this.attempts.set(key, { count: 1, firstAttemptAt: now });
      return true;
    }

    record.count++;

    if (record.count > MAX_ATTEMPTS) {
      const retryAfterSeconds = Math.ceil(
        (record.firstAttemptAt + WINDOW_MS - now) / 1000,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Trop de tentatives. Réessayez plus tard.',
          retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /** Efface les fenêtres expirées, une fois toutes les SWEEP_EVERY requêtes. */
  private maybeSweep(now: number): void {
    if (++this.requestsSinceSweep < SWEEP_EVERY) return;
    this.requestsSinceSweep = 0;
    for (const [key, record] of this.attempts) {
      if (now - record.firstAttemptAt > WINDOW_MS) this.attempts.delete(key);
    }
  }

  /** Réinitialise le compteur d'une IP — appelé après une saisie correcte. */
  clear(ip: string | undefined): void {
    this.attempts.delete(ip ?? 'inconnu');
  }
}
