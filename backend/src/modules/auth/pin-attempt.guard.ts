import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Garde-fou contre l'énumération du code PIN, par adresse IP.
 *
 * À calibrer sur le bon adversaire. Le PIN est un CONTRÔLE PARENTAL : il empêche l'enfant
 * d'ouvrir les réglages. Une enfant qui tâtonne n'épuisera jamais 10 000 combinaisons ;
 * ce garde-fou ne la concerne pas.
 *
 * Ce qu'il couvre réellement : quelqu'un à qui une invitation a été envoyée pourrait
 * scripter les 10 000 combinaisons en quelques secondes, et l'accès administrateur permet
 * de réinitialiser la progression : la seule donnée irremplaçable du projet. C'est ce
 * scénario-là, et lui seul, qui justifie la limite.
 *
 * Le seuil est donc généreux : un parent qui se trompe sur un téléphone ne doit jamais
 * s'enfermer dehors. 30 essais par quart d'heure laissent toute la marge nécessaire tout
 * en ramenant une énumération complète à plusieurs jours.
 *
 * Par IP et non globalement : un compteur global permettrait à un invité de verrouiller
 * l'accès du parent en épuisant volontairement les essais.
 *
 * En mémoire et non `@nestjs/throttler` : l'application tourne en instance unique. Un
 * compteur en mémoire suffit, ne dépend de rien, et se réinitialise au redémarrage : ce
 * qui est acceptable ici. Ce choix serait faux derrière plusieurs répliques.
 */

const MAX_ATTEMPTS = 30;
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

  /** Réinitialise le compteur d'une IP : appelé après une saisie correcte. */
  clear(ip: string | undefined): void {
    this.attempts.delete(ip ?? 'inconnu');
  }
}
