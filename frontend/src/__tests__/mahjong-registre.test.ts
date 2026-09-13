import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES } from 'src/modules.manifest';

/**
 * Comme pour morpion/puissance4 (peage-jeux.test.ts, jeux-modules.test.ts) : un jeu
 * hors-moule tient surtout par son bon rangement. Ce test verrouille les choix
 * d'integration de EM-38 a EM-42, pour qu'un futur module ajoute a cote sans les defaire
 * par megarde.
 */

const CATALOG = readFileSync(
  join(__dirname, '../../../backend/src/modules/catalog/modules.config.ts'),
  'utf-8',
);

describe('rangement du module mahjong', () => {
  const module = MODULES.find((m) => m.id === 'mahjong');

  it('est classe dans la categorie jeux (peage + exclu du tirage au hasard)', () => {
    expect(module?.category).toBe('jeux');
  });

  it('passe par la porte de sortie `child`, pas par le moteur commun', () => {
    expect(module?.child?.Game).toBeTypeOf('function');
    expect(module?.loadGameSpec).toBeUndefined();
  });

  it('declare sa propre option `difficulty` (evite la question de niveau injectee par defaut)', () => {
    const cles = module?.setupOptions?.map((o) => o.key) ?? [];
    expect(cles).toContain('difficulty');
    expect(cles).toContain('pairs_count');
    expect(cles).toContain('forme');
  });

  it('propose les dix dispositions classiques pour le mode Difficile', () => {
    const forme = module?.setupOptions?.find((o) => o.key === 'forme');
    expect(forme?.choices).toHaveLength(10);
    expect(forme?.choices?.map((c) => c.value)).toContain('turtle_classic');
  });

  it('propose les trois modes de difficulte', () => {
    const difficulte = module?.setupOptions?.find((o) => o.key === 'difficulty');
    expect(difficulte?.choices?.map((c) => c.value)).toEqual(['facile', 'moyen', 'difficile']);
  });

  it("est actif dans le catalogue backend, visible sur l'accueil", () => {
    const bloc = CATALOG.slice(CATALOG.indexOf("id: 'mahjong'"));
    expect(bloc).toMatch(/is_active:\s*true/);
  });
});
