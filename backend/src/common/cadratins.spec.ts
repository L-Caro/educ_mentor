import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Le pendant backend de `frontend/src/__tests__/cadratins.test.ts`. Même règle, même
 * raison : elle était écrite dans `frontend/CLAUDE.md` et aucun test ne la tenait, alors
 * 762 cadratins se sont accumulés.
 */
const LEGITIMES = new Set([
  // La ponctuation que la dictée rogne aux bords d'un mot, et son test.
  'modules/dictee/dictee.logic.ts',
  'modules/dictee/dictee.logic.spec.ts',
  // Ce test lui-même.
  'common/cadratins.spec.ts',
]);

const RACINE = join(__dirname, '..');

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return nom.endsWith('.ts') ? [chemin] : [];
  });
}

describe('pas de cadratins', () => {
  it('n’en laisse aucun dans le code, les commentaires compris', () => {
    const fautifs: string[] = [];
    for (const chemin of fichiers(RACINE)) {
      const relatif = relative(RACINE, chemin).replace(/\\/g, '/');
      if (LEGITIMES.has(relatif)) continue;
      readFileSync(chemin, 'utf-8')
        .split('\n')
        .forEach((ligne, i) => {
          if (ligne.includes('—')) fautifs.push(`${relatif}:${i + 1}`);
        });
    }
    expect(fautifs).toEqual([]);
  });
});
