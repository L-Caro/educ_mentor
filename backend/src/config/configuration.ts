/** Configuration de l'application, lue depuis l'environnement.
 *
 * Les défauts sont pensés pour le développement local. `collectProductionSecretIssues` (appelée au
 * démarrage depuis main.ts) refuse de laisser booter la production avec ces défauts : un
 * `JWT_SECRET` oublié signifiait démarrer avec un secret présent dans le dépôt git, donc
 * la possibilité de forger un token administrateur. */

/** Le code PIN est un CONTRÔLE PARENTAL : il empêche l'enfant d'ouvrir les réglages, il ne
 * protège ni donnée sensible ni argent. Sa valeur par défaut ne justifie donc pas de refuser
 * un démarrage — d'autant qu'elle ne sert qu'au tout premier boot sur une base vierge, et
 * devient inerte dès qu'un hash existe en base. */

/** Longueur plancher du secret JWT. Ce n'est pas une norme : le seuil sert à écarter un
 * secret manifestement bidon (« changeme », un mot, une valeur tronquée), pas à mesurer
 * l'entropie — que la longueur ne dit pas. À 23 caractères aléatoires on est déjà bien
 * au-delà de ce que HMAC-SHA256 exige. */
export const MIN_JWT_SECRET_LENGTH = 23;

export const DEV_JWT_SECRET = 'dev_secret_change_in_prod';
export const DEV_DEFAULT_PIN = '1234';

export default () => ({
  port: parseInt(process.env.BACKEND_PORT ?? '4005', 10),
  adminPinEnabled: process.env.ADMIN_PIN_ENABLED !== 'false',
  jwtSecret: process.env.JWT_SECRET ?? DEV_JWT_SECRET,
  defaultPin: process.env.DEFAULT_PIN ?? DEV_DEFAULT_PIN,
  dbPath: process.env.DB_PATH ?? './data/educmentor.db',
  // Défaut `false` volontaire : un oubli de variable ne doit pas pouvoir détruire de données.
  dbSynchronize: process.env.DB_SYNCHRONIZE === 'true',
  imagesPath: process.env.IMAGES_PATH ?? './data/images',
  staticPath: process.env.STATIC_PATH ?? './static',
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  adminBootstrapToken: process.env.ADMIN_BOOTSTRAP_TOKEN ?? '',
});

/**
 * Vérifie que la production ne démarre pas avec des secrets de développement.
 * Retourne la liste des problèmes ; un tableau vide signifie « bon pour le démarrage ».
 *
 * Exporté séparément pour être testable sans démarrer l'application.
 */
export function collectProductionSecretIssues(
  env: NodeJS.ProcessEnv,
): string[] {
  if (env.NODE_ENV !== 'production') return [];

  const issues: string[] = [];

  if (!env.JWT_SECRET) {
    issues.push('JWT_SECRET est absent.');
  } else if (env.JWT_SECRET === DEV_JWT_SECRET) {
    issues.push(
      'JWT_SECRET vaut le secret de développement, qui figure dans le dépôt git.',
    );
  } else if (env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    issues.push(
      `JWT_SECRET fait ${env.JWT_SECRET.length} caractères ; ${MIN_JWT_SECRET_LENGTH} au minimum sont attendus.`,
    );
  }

  // Malgré son nom, ADMIN_PIN_ENABLED=false ne désactive pas seulement le code PIN : il
  // court-circuite AccessGuard, donc le portail d'invitation lui-même — toute l'API devient
  // publique. C'est ce point-là qui justifie un refus de démarrage, pas le code PIN.
  if (env.ADMIN_PIN_ENABLED === 'false') {
    issues.push(
      'ADMIN_PIN_ENABLED=false court-circuite AccessGuard : toute l’API devient accessible sans invitation.',
    );
  }

  if (env.DB_SYNCHRONIZE === 'true') {
    issues.push(
      'DB_SYNCHRONIZE=true réaligne le schéma sur les entités et peut supprimer des colonnes.',
    );
  }

  return issues;
}
