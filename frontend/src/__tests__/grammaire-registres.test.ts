import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAIRE_SETUP_OPTIONS } from 'src/modules/grammaire/grammaire.setup';
import { buildInitialValues } from 'src/components/game/setup/setupOptions';

/**
 * Le module grammaire décrit le même vocabulaire dans TROIS fichiers qui doivent rester
 * d'accord — et aucun outil ne les relie :
 *   1. `backend/.../grammaire.notions.ts`   le catalogue de notions, source de vérité
 *   2. `frontend/.../grammaire.type.ts`     l'union `NotionKey`, qui type la table des leçons
 *   3. `frontend/.../grammaire.setup.ts`    les types d'exercice proposés au pré-jeu
 *
 * Une notion ajoutée côté backend sans son pendant frontend passe le typage des deux côtés
 * et casse à l'exécution, sur `LECONS[question.skill_key]` : la fiche vaut `undefined` et
 * l'écran de correction plante. Un type d'exercice renommé côté backend rend une option de
 * pré-jeu silencieusement inerte — la case se coche et ne produit rien.
 *
 * Les fichiers sont lus sur disque, pas importés : les deux paquets ont des configurations
 * TypeScript distinctes et aucune dépendance entre eux, comme dans `modules-registry.test.ts`.
 */

const FRONT = join(__dirname, '..');
const BACK = join(FRONT, '../../backend/src/modules/grammaire');

const NOTIONS_BACK = readFileSync(join(BACK, 'grammaire.notions.ts'), 'utf-8');
const LOGIC_BACK = readFileSync(join(BACK, 'grammaire.logic.ts'), 'utf-8');
const TYPE_FRONT = readFileSync(
  join(FRONT, 'modules/grammaire/grammaire.type.ts'),
  'utf-8',
);
const FICHE_FRONT = readFileSync(
  join(FRONT, 'modules/grammaire/grammaire.fiche.tsx'),
  'utf-8',
);

/** Les clés du catalogue backend : `key: 'nom_commun',` dans le tableau NOTIONS. */
function notionsBackend(): string[] {
  return [...NOTIONS_BACK.matchAll(/^\s{4}key: '([^']+)',$/gm)]
    .map((match) => match[1])
    .sort();
}

/** Les membres d'une union de chaînes déclarée dans un fichier frontend. */
function unionFrontend(source: string, nom: string): string[] {
  const bloc = new RegExp(`export type ${nom} =([^;]*);`, 's').exec(source)?.[1] ?? '';
  return [...bloc.matchAll(/'([^']+)'/g)].map((match) => match[1]).sort();
}

function questionTypesBackend(): string[] {
  const bloc =
    /export const QUESTION_TYPES: QuestionType\[\] = \[([^\]]*)\]/s.exec(
      LOGIC_BACK,
    )?.[1] ?? '';
  return [...bloc.matchAll(/'([^']+)'/g)].map((match) => match[1]).sort();
}

describe('registres du module grammaire', () => {
  it('trouve bien les trois registres (garde-fou sur les expressions régulières)', () => {
    expect(notionsBackend().length).toBeGreaterThan(5);
    expect(unionFrontend(TYPE_FRONT, 'NotionKey').length).toBeGreaterThan(5);
    expect(questionTypesBackend().length).toBeGreaterThan(2);
  });

  it('déclare les mêmes notions côté backend et côté frontend', () => {
    const backend = notionsBackend();
    const frontend = unionFrontend(TYPE_FRONT, 'NotionKey');
    expect({
      absentesDuFrontend: backend.filter((key) => !frontend.includes(key)),
      absentesDuBackend: frontend.filter((key) => !backend.includes(key)),
    }).toEqual({ absentesDuFrontend: [], absentesDuBackend: [] });
  });

  it('donne une leçon à chaque notion — sinon la fiche vaut undefined à l’écran', () => {
    // La table `LECONS` est typée `Record<NotionKey, Lecon>`, donc exhaustive au regard du
    // typage ; ce test vérifie qu'elle l'est au regard du BACKEND, qui est la vraie source.
    const sansLecon = notionsBackend().filter(
      (key) => !new RegExp(`^  ${key}: \\{$`, 'm').test(FICHE_FRONT),
    );
    expect(sansLecon).toEqual([]);
  });

  it('déclare les mêmes types de question côté backend et côté frontend', () => {
    const backend = questionTypesBackend();
    expect(unionFrontend(TYPE_FRONT, 'GrammaireQuestionType')).toEqual(backend);
  });

  it('propose au pré-jeu exactement les types de question du backend', () => {
    const option = GRAMMAIRE_SETUP_OPTIONS[0];
    expect((option.choices ?? []).map((choice) => choice.value).sort()).toEqual(
      questionTypesBackend(),
    );
  });
});

describe('GRAMMAIRE_SETUP_OPTIONS', () => {
  it('ne déclare que questionTypes (difficulty reste la commune)', () => {
    expect(GRAMMAIRE_SETUP_OPTIONS.map((option) => option.key)).toEqual([
      'questionTypes',
    ]);
  });

  it('sélectionne tous les types par défaut (opt-out, pas opt-in)', () => {
    const values = buildInitialValues(GRAMMAIRE_SETUP_OPTIONS);
    const option = GRAMMAIRE_SETUP_OPTIONS[0];
    expect((values.questionTypes as string[]).sort()).toEqual(
      (option.choices ?? []).map((choice) => choice.value).sort(),
    );
  });
});
