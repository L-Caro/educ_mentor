import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES } from 'src/modules.manifest';

/**
 * L'accueil, vérifié sur la source et sur le manifeste.
 *
 * Ce qui est en jeu n'est pas visible à l'œil en jouant : que « Au hasard » n'attrape
 * jamais un jeu, que la section Jeux soit bien celle qui est repliée, et que chaque
 * module actif tombe dans une section. Un module sans catégorie n'apparaîtrait dans
 * AUCUNE section — il disparaîtrait de l'accueil sans que rien ne le signale.
 */

const SOURCE = readFileSync(
  join(__dirname, '../components/layout/HomeLayout.tsx'),
  'utf-8',
);

/** Les membres d'un tableau de catégories déclaré dans HomeLayout. */
function liste(nom: string): string[] {
  const bloc = new RegExp(
    `const ${nom}: ModuleCategory\\[\\] = \\[([^\\]]*)\\]`,
  ).exec(SOURCE)?.[1];
  expect(bloc, `${nom} introuvable`).toBeTruthy();
  return [...bloc!.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

describe('sections de l’accueil', () => {
  it('met les jeux en dernier', () => {
    const ordre = liste('CATEGORY_ORDER');
    expect(ordre.at(-1)).toBe('jeux');
  });

  it('replie les jeux à la première visite, et eux seuls', () => {
    expect(liste('REPLIEES_PAR_DEFAUT')).toEqual(['jeux']);
  });

  it('classe chaque module du manifeste dans une catégorie connue', () => {
    // Un module sans catégorie ne tomberait dans aucune section : il disparaîtrait de
    // l'accueil, activé mais invisible. C'est exactement le bug qu'avait eu `snake`.
    const connues = liste('CATEGORY_ORDER');
    const orphelins = MODULES.filter(
      (mod) => !mod.category || !connues.includes(mod.category),
    ).map((mod) => mod.id);
    expect(orphelins).toEqual([]);
  });

  it('donne un libellé et un emoji à chaque catégorie de l’ordre', () => {
    const meta = /CATEGORY_META: Record<ModuleCategory[^>]*> = \{([\s\S]*?)\n\};/.exec(
      SOURCE,
    )?.[1];
    expect(meta).toBeTruthy();
    for (const categorie of liste('CATEGORY_ORDER')) {
      expect(meta).toContain(`${categorie}:`);
    }
  });
});

describe('« Au hasard »', () => {
  it('exclut les jeux du tirage', () => {
    // Le bouton propose du TRAVAIL. Y laisser entrer Snake en ferait une façon de ne
    // pas travailler, ce qui est l'inverse de son intention.
    expect(liste('HORS_HASARD')).toEqual(['jeux']);
  });

  it('laisse de quoi piocher une fois les jeux écartés', () => {
    const hors = liste('HORS_HASARD');
    const piochables = MODULES.filter(
      (mod) => mod.category && !hors.includes(mod.category),
    );
    expect(piochables.length).toBeGreaterThan(5);
  });

  it('évite de retomber sur le module précédent', () => {
    // Deux fois de suite le même donne l'impression que le bouton est cassé. La garde
    // ne s'applique que s'il y a le choix : avec un seul module, mieux vaut le
    // reproposer que ne rien faire.
    expect(SOURCE).toContain('lireDernierHasard');
    expect(SOURCE).toContain('pochette.length > 1');
    expect(SOURCE).toContain('ecrireDernierHasard');
  });

  it('ne se montre pas quand il n’y a rien à piocher', () => {
    expect(SOURCE).toContain('pochette.length > 0 &&');
  });
});

describe('robustesse du stockage local', () => {
  it('entoure chaque accès de localStorage d’un try', () => {
    // Navigation privée, réglages du navigateur, capture de vignette : l'accès peut
    // lever. L'accueil doit rester utilisable et retomber sur les défauts.
    const acces = [...SOURCE.matchAll(/localStorage\.(getItem|setItem)/g)];
    expect(acces.length).toBeGreaterThanOrEqual(4);
    const essais = [...SOURCE.matchAll(/\btry\s*\{/g)];
    expect(essais.length).toBeGreaterThanOrEqual(acces.length);
  });

  it('replie les jeux quand le réglage enregistré est illisible', () => {
    expect(SOURCE).toContain('return new Set(REPLIEES_PAR_DEFAUT);');
  });
});
