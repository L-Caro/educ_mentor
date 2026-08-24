import { isPrivateKey } from './settings.service';

/**
 * `GET /api/settings` n'est pas protégé — le frontend enfant en a besoin. C'est donc ce
 * prédicat, et lui seul, qui empêche un secret de sortir de l'application.
 */

describe('isPrivateKey', () => {
  it('retient les clés qui portent un secret', () => {
    for (const key of [
      'admin_pin_hash',
      'jwt_secret',
      'admin_bootstrap_token',
      'ADMIN_PIN_HASH',
      'un_hash_quelconque',
    ]) {
      expect(isPrivateKey(key)).toBe(true);
    }
  });

  it('laisse passer les réglages de jeu', () => {
    for (const key of [
      'questions_per_session',
      'question_timer_seconds',
      'mastery_threshold',
      'accent_tolerance',
      'geo_countries_filter',
      'monnaie_denominations',
      'tables_include_trivial',
    ]) {
      expect(isPrivateKey(key)).toBe(false);
    }
  });

  it('protège un futur secret nommé selon la convention, sans modification', () => {
    // C'est l'intérêt du filtre structurel sur une liste nominative : le prochain secret
    // est couvert même si personne ne pense à mettre ce test à jour.
    expect(isPrivateKey('smtp_password_hash')).toBe(true);
    expect(isPrivateKey('api_token_openai')).toBe(true);
  });
});
