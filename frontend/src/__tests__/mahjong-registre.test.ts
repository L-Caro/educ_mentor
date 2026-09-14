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

  it('ne pose QU’UNE question avant de jouer : la disposition', () => {
    // Le module a eu trois modes et un choix du nombre de paires. Les deux sont partis :
    // le vrai Mahjong Solitaire est le plateau en volume, les autres modes n'etaient
    // qu'un jeu de paires deguise, et « 144 tuiles » est la definition d'une disposition
    // classique, pas un reglage.
    expect(module?.setupOptions?.map((o) => o.key)).toEqual(['forme']);
  });

  it('ferme la porte a la question de niveau injectee par le pre-jeu', () => {
    // Le pre-jeu injecte sa propre option `difficulty` - « 2 choix / 4 choix / Saisie
    // libre » - a tout module qui n'en declare pas une. Ca ne veut rien dire sur un
    // plateau de Mahjong. Le module avait sa propre cle tant qu'il avait trois modes ;
    // en la retirant, il fallait fermer derriere.
    expect(module?.skipDifficulty).toBe(true);
  });

  it('propose les dix dispositions classiques', () => {
    const forme = module?.setupOptions?.find((o) => o.key === 'forme');
    expect(forme?.choices).toHaveLength(10);
    expect(forme?.choices?.map((c) => c.value)).toContain('turtle_classic');
  });

  it("est actif dans le catalogue backend, visible sur l'accueil", () => {
    const bloc = CATALOG.slice(CATALOG.indexOf("id: 'mahjong'"));
    expect(bloc).toMatch(/is_active:\s*true/);
  });
});
