import { describe, expect, it } from 'vitest';
import { geoGameSpec } from 'src/modules/geo/geo.game';
import { franceGameSpec } from 'src/modules/france/france.game';

/**
 * `getComponent` doit renvoyer un type de composant STABLE.
 *
 * geo et france renvoyaient une fonction fléchée créée à l'appel : React voyait un type de
 * composant différent à chaque rendu et démontait puis remontait tout le sous-arbre — la
 * carte SVG entière était reconstruite à chaque clic, chaque sélection, chaque tick du
 * minuteur. Le symptôme est diffus et purement visuel : rien ne le signale.
 *
 * ESLint attrape le motif dans le moteur mais pas dans les specs, où deux dérogations
 * ciblées sont posées. Ce test est le garde-fou qui rend ces dérogations sûres.
 */

// Formes de question minimales : seules les clés lues par getComponent comptent.
const geoQuestions = [
  { type: 'identify_continent' },
  { type: 'identify_country' },
  { type: 'identify_country', continent: 'europe' },
  { type: 'identify_country', map_filter: ['fr', 'de'] },
  { type: 'identify_country', continent: 'asia', map_filter: ['jp'] },
];

const franceQuestions = [
  { type: 'locate_city', hide_dept_borders: true },
  { type: 'locate_city', hide_dept_borders: false },
  { type: 'locate_city' },
];

describe('geo — stabilité du composant de carte', () => {
  it('renvoie la même référence pour deux appels sur la même question', () => {
    for (const question of geoQuestions) {
      const first = geoGameSpec.map!.getComponent(question as never);
      const second = geoGameSpec.map!.getComponent(question as never);
      expect(first).toBe(second);
    }
  });

  it('ne renvoie qu’un composant par variante de carte, pas un par question', () => {
    // 5 questions, 2 cartes distinctes (monde / continent) : au-delà, une closure est créée.
    const components = new Set(
      geoQuestions.map((q) => geoGameSpec.map!.getComponent(q as never)),
    );
    expect(components.size).toBe(2);
  });

  it('fait passer la configuration par les props, pas par une fermeture', () => {
    const filtered = geoGameSpec.map!.getComponentProps!({
      type: 'identify_country',
      continent: 'europe',
      map_filter: ['fr', 'de'],
    } as never);

    expect(filtered.continent).toBe('europe');
    expect(filtered.visibleKeys).toEqual(new Set(['fr', 'de']));
  });
});

describe('france — stabilité du composant de carte à point', () => {
  it('renvoie toujours la même référence, masquage des frontières compris', () => {
    const components = new Set(
      franceQuestions.map((q) => franceGameSpec.pointMap!.getComponent(q as never)),
    );
    expect(components.size).toBe(1);
  });

  it('transmet le masquage des frontières par les props', () => {
    expect(
      franceGameSpec.pointMap!.getComponentProps!({ hide_dept_borders: true } as never),
    ).toEqual({ hideBorders: true });
    expect(
      franceGameSpec.pointMap!.getComponentProps!({ hide_dept_borders: false } as never),
    ).toEqual({ hideBorders: false });
    // Absent = non masqué : le booléen doit être strict, pas `undefined`.
    expect(franceGameSpec.pointMap!.getComponentProps!({} as never)).toEqual({
      hideBorders: false,
    });
  });
});
