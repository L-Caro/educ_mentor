import {
  collectProductionSecretIssues,
  DEV_DEFAULT_PIN,
  DEV_JWT_SECRET,
  MIN_JWT_SECRET_LENGTH,
} from './configuration';

/**
 * Ce garde-fou décide si la production démarre. Un faux négatif laisserait tourner un
 * serveur signant ses tokens administrateur avec un secret présent dans le dépôt git ;
 * un faux positif empêcherait tout déploiement. Les deux méritent un test.
 */

const validProd = {
  NODE_ENV: 'production',
  JWT_SECRET: 'x'.repeat(48),
  DEFAULT_PIN: '7391',
};

describe('collectProductionSecretIssues', () => {
  it('ne dit rien hors production, même avec les défauts de développement', () => {
    expect(
      collectProductionSecretIssues({
        JWT_SECRET: DEV_JWT_SECRET,
        DEFAULT_PIN: DEV_DEFAULT_PIN,
      }),
    ).toEqual([]);
    expect(collectProductionSecretIssues({ NODE_ENV: 'development' })).toEqual(
      [],
    );
    expect(
      collectProductionSecretIssues({
        NODE_ENV: 'test',
        DB_SYNCHRONIZE: 'true',
      }),
    ).toEqual([]);
  });

  it('laisse démarrer une production correctement configurée', () => {
    expect(collectProductionSecretIssues(validProd)).toEqual([]);
  });

  it('applique le plancher de longueur pile à la limite', () => {
    const tooShort = 'a'.repeat(MIN_JWT_SECRET_LENGTH - 1);
    const justEnough = 'a'.repeat(MIN_JWT_SECRET_LENGTH);

    expect(
      collectProductionSecretIssues({ ...validProd, JWT_SECRET: tooShort }),
    ).toHaveLength(1);
    expect(
      collectProductionSecretIssues({ ...validProd, JWT_SECRET: justEnough }),
    ).toEqual([]);
  });

  it('refuse un JWT_SECRET absent, de développement, ou trop court', () => {
    expect(
      collectProductionSecretIssues({ ...validProd, JWT_SECRET: undefined }),
    ).toHaveLength(1);
    expect(
      collectProductionSecretIssues({
        ...validProd,
        JWT_SECRET: DEV_JWT_SECRET,
      }),
    ).toHaveLength(1);
    expect(
      collectProductionSecretIssues({ ...validProd, JWT_SECRET: 'court' }),
    ).toHaveLength(1);
  });

  it('ne bloque PAS sur le code PIN par défaut', () => {
    // Le PIN est un contrôle parental, pas une frontière de sécurité, et DEFAULT_PIN ne sert
    // qu'au premier boot sur une base vierge. Refuser un démarrage de production pour ça,
    // c'est fabriquer une panne sans bénéfice.
    expect(
      collectProductionSecretIssues({
        ...validProd,
        DEFAULT_PIN: DEV_DEFAULT_PIN,
      }),
    ).toEqual([]);
  });

  it("refuse ADMIN_PIN_ENABLED=false, qui ouvre l'API entière", () => {
    // Le nom trompe : cette variable court-circuite aussi AccessGuard, donc le portail
    // d'invitation. Le message doit nommer le vrai risque, pas le code PIN.
    const issues = collectProductionSecretIssues({
      ...validProd,
      ADMIN_PIN_ENABLED: 'false',
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('AccessGuard');
  });

  it('refuse DB_SYNCHRONIZE en production', () => {
    const issues = collectProductionSecretIssues({
      ...validProd,
      DB_SYNCHRONIZE: 'true',
    });
    expect(issues.join(' ')).toContain('DB_SYNCHRONIZE');
  });

  it('signale tous les problèmes d’un coup, pas seulement le premier', () => {
    // Un diagnostic partiel ferait redémarrer/redéployer autant de fois qu'il y a d'erreurs.
    const issues = collectProductionSecretIssues({
      NODE_ENV: 'production',
      ADMIN_PIN_ENABLED: 'false',
      DB_SYNCHRONIZE: 'true',
    });
    // JWT_SECRET absent + AccessGuard court-circuité + synchronize actif
    expect(issues.length).toBeGreaterThanOrEqual(3);
  });
});
