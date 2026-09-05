import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Le module géométrie a un catalogue de formes en DEUX endroits qui doivent rester
 * d'accord sur les clés :
 *   1. `backend/src/modules/geometrie/geometrie.shapes.ts`         propriétés (côtés, angle droit…)
 *   2. `frontend/src/cours/components/catalogue-formes.tsx`        le tracé SVG
 *
 * Le back ignore tout du SVG et le front ignore tout des propriétés : rien ne les relie
 * à la compilation. Une forme ajoutée d'un seul côté produirait soit une question sans
 * dessin, soit un dessin jamais interrogé : dans les deux cas, silencieusement.
 *
 * Les fichiers sont lus sur disque plutôt qu'importés : les deux paquets ont des
 * configurations TypeScript distinctes, sans dépendance entre eux.
 */

const FRONT_SRC = join(__dirname, '..');
const SHAPES_PATH = join(FRONT_SRC, '../../backend/src/modules/geometrie/geometrie.shapes.ts');
const CATALOGUE_PATH = join(FRONT_SRC, 'cours/components/catalogue-formes.tsx');

function backendShapeKeys(): string[] {
  const source = readFileSync(SHAPES_PATH, 'utf-8');
  return [...source.matchAll(/key: '([^']+)'/g)].map((m) => m[1]).sort();
}

/** Clés de premier niveau de l'objet `FORMES` : indentées de deux espaces, seul endroit du
 * fichier où ce motif apparaît (les fonctions utilitaires sont au niveau racine). */
function frontendCatalogueKeys(): string[] {
  const source = readFileSync(CATALOGUE_PATH, 'utf-8');
  return [...source.matchAll(/^ {2}([a-zA-Z]+):/gm)].map((m) => m[1]).sort();
}

describe('catalogue de formes : cohérence back/front', () => {
  it('trouve bien les deux registres (garde-fou sur les expressions régulières)', () => {
    expect(backendShapeKeys().length).toBeGreaterThan(20);
    expect(frontendCatalogueKeys().length).toBeGreaterThan(20);
  });

  it('chaque forme du back a son tracé SVG côté front', () => {
    const backend = backendShapeKeys();
    const frontend = new Set(frontendCatalogueKeys());
    const sansTrace = backend.filter((key) => !frontend.has(key));
    expect(sansTrace).toEqual([]);
  });
});
