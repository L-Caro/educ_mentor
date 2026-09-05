import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACCORDS_SETUP_OPTIONS } from 'src/modules/accords/accords.setup';
import { buildInitialValues } from 'src/components/game/setup/setupOptions';

/**
 * Comme pour le module grammaire : le vocabulaire du module est décrit dans trois fichiers
 * qu'aucun outil ne relie. Une notion ajoutée côté backend sans son pendant frontend passe
 * le typage des deux côtés et casse à l'exécution sur `LECONS[question.skill_key]` : la
 * fiche vaut `undefined` et l'écran de correction plante.
 *
 * Ici notion et type d'exercice coïncident, donc les trois registres portent la MÊME liste
 * de clés : ce qui rend la vérification d'autant plus simple, et son absence d'autant plus
 * bête.
 */

const FRONT = join(__dirname, '..');
const BACK = join(FRONT, '../../backend/src/modules/accords');

const NOTIONS_BACK = readFileSync(join(BACK, 'accords.notions.ts'), 'utf-8');
const TYPE_FRONT = readFileSync(
  join(FRONT, 'modules/accords/accords.type.ts'),
  'utf-8',
);
const FICHE_FRONT = readFileSync(
  join(FRONT, 'modules/accords/accords.fiche.tsx'),
  'utf-8',
);

function notionsBackend(): string[] {
  return [...NOTIONS_BACK.matchAll(/^\s{4}key: '([^']+)',$/gm)]
    .map((match) => match[1])
    .sort();
}

function unionFrontend(nom: string): string[] {
  const bloc = new RegExp(`export type ${nom} =([^;]*);`, 's').exec(
    TYPE_FRONT,
  )?.[1] ?? '';
  return [...bloc.matchAll(/'([^']+)'/g)].map((match) => match[1]).sort();
}

describe('registres du module accords', () => {
  it('trouve bien les registres (garde-fou sur les expressions régulières)', () => {
    expect(notionsBackend()).toHaveLength(5);
    expect(unionFrontend('NotionKey')).toHaveLength(5);
  });

  it('déclare les mêmes notions côté backend et côté frontend', () => {
    const backend = notionsBackend();
    const frontend = unionFrontend('NotionKey');
    expect({
      absentesDuFrontend: backend.filter((key) => !frontend.includes(key)),
      absentesDuBackend: frontend.filter((key) => !backend.includes(key)),
    }).toEqual({ absentesDuFrontend: [], absentesDuBackend: [] });
  });

  it('donne une leçon à chaque notion, sinon la fiche vaut undefined à l’écran', () => {
    const sansLecon = notionsBackend().filter(
      (key) => !new RegExp(`^  ${key}: \\{$`, 'm').test(FICHE_FRONT),
    );
    expect(sansLecon).toEqual([]);
  });

  it('propose au pré-jeu exactement les cinq exercices du backend', () => {
    const option = ACCORDS_SETUP_OPTIONS[0];
    expect((option.choices ?? []).map((choice) => choice.value).sort()).toEqual(
      notionsBackend(),
    );
  });

  it('garde l’ordre pédagogique des fiches dans le pré-jeu', () => {
    // Le genre et le nombre disent de quoi un nom est marqué ; les trois accords suivants
    // ne sont que la façon dont les autres mots recopient ces marques. Trier par ordre
    // alphabétique casserait ce fil.
    const option = ACCORDS_SETUP_OPTIONS[0];
    expect((option.choices ?? []).map((choice) => choice.value)).toEqual([
      'genre_nom',
      'nombre_nom',
      'accord_adjectif',
      'accord_gn',
      'accord_sujet_verbe',
    ]);
  });
});

describe('ACCORDS_SETUP_OPTIONS', () => {
  it('ne déclare que questionTypes (difficulty reste la commune)', () => {
    expect(ACCORDS_SETUP_OPTIONS.map((option) => option.key)).toEqual([
      'questionTypes',
    ]);
  });

  it('sélectionne tous les exercices par défaut (opt-out, pas opt-in)', () => {
    const values = buildInitialValues(ACCORDS_SETUP_OPTIONS);
    const option = ACCORDS_SETUP_OPTIONS[0];
    expect((values.questionTypes as string[]).sort()).toEqual(
      (option.choices ?? []).map((choice) => choice.value).sort(),
    );
  });
});
