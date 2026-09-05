import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Un module vit à TROIS endroits qui doivent rester d'accord :
 *   1. `frontend/src/modules/<id>/<id>.module.tsx`      son descripteur
 *   2. `frontend/src/modules.manifest.tsx`               routes et écrans d'administration
 *   3. `backend/src/modules/catalog/modules.config.ts`   catalogue en base
 *
 * La grille d'accueil est construite depuis le catalogue BACKEND, pas depuis le manifeste
 * frontend. Un module absent du catalogue n'apparaît donc jamais, sans le moindre message
 * d'erreur : c'est ce qui est arrivé à `snake`, invisible sur l'accueil pendant des semaines
 * alors que sa route et son écran d'administration existaient.
 *
 * Les fichiers sont lus sur disque plutôt qu'importés : les deux paquets ont des
 * configurations TypeScript distinctes, aucune dépendance entre eux, et un import du
 * manifeste entraînerait tout le store Redux dans un test qui n'en a pas besoin.
 */

const FRONT_SRC = join(__dirname, '..');
const MODULES_DIR = join(FRONT_SRC, 'modules');
const MANIFEST_PATH = join(FRONT_SRC, 'modules.manifest.tsx');
const CATALOG_PATH = join(FRONT_SRC, '../../backend/src/modules/catalog/modules.config.ts');

/** Modules présents sur disque : nom de dossier + identifiant déclaré.
 * Les deux diffèrent parfois : le dossier `calcul` déclare l'identifiant `calcul-mental`. */
function moduleFolders(): string[] {
  return readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** Les dossiers de `modules/` qui n'ont pas de descripteur.
 *
 * Sous `modules/`, un dossier EST un module. Y déposer une bibliothèque partagée faisait
 * échouer les trois tests suivants sur un `ENOENT` brut, qui ne disait pas la règle : le
 * temps perdu à le comprendre est allé à la trace d'appel au lieu du diagnostic. Une
 * bibliothèque va dans `utils/`. */
function foldersSansDescripteur(): string[] {
  return moduleFolders().filter(
    (folder) => !existsSync(join(MODULES_DIR, folder, `${folder}.module.tsx`)),
  );
}

function declaredModules(): { folder: string; id: string }[] {
  return moduleFolders()
    .filter((folder) =>
      existsSync(join(MODULES_DIR, folder, `${folder}.module.tsx`)),
    )
    .flatMap((folder) => {
      const source = readFileSync(join(MODULES_DIR, folder, `${folder}.module.tsx`), 'utf-8');
      const id = /\bid:\s*'([^']+)'/.exec(source)?.[1];
      return id ? [{ folder, id }] : [];
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function declaredModuleIds(): string[] {
  return declaredModules().map((m) => m.id).sort();
}

/** Descripteurs effectivement agrégés dans le tableau MODULES. */
function manifestModuleNames(): string[] {
  const source = readFileSync(MANIFEST_PATH, 'utf-8');
  const array = /export const MODULES[^=]*=\s*\[([^\]]*)\]/s.exec(source)?.[1] ?? '';
  return array.split(',').map((entry) => entry.trim()).filter(Boolean).sort();
}

function backendCatalogIds(): string[] {
  const source = readFileSync(CATALOG_PATH, 'utf-8');
  return [...source.matchAll(/^\s{4}id: '([^']+)',$/gm)].map((m) => m[1]).sort();
}

describe('registres de modules', () => {
  it("n'a sous modules/ que des dossiers de module", () => {
    // Un dossier sans `<nom>.module.tsx` n'est pas un module : c'est une bibliothèque,
    // et sa place est dans `utils/`. Ce test doit passer AVANT les autres, sinon ils
    // échouent tous les trois sur une erreur de fichier introuvable qui ne dit pas
    // pourquoi.
    expect({
      dossiersSansDescripteur: foldersSansDescripteur(),
    }).toEqual({ dossiersSansDescripteur: [] });
  });

  it('trouve bien les trois registres (garde-fou sur les expressions régulières)', () => {
    expect(declaredModuleIds().length).toBeGreaterThan(5);
    expect(manifestModuleNames().length).toBeGreaterThan(5);
    expect(backendCatalogIds().length).toBeGreaterThan(5);
  });

  it('déclare les mêmes identifiants côté frontend et côté backend', () => {
    const frontend = declaredModuleIds();
    const backend = backendCatalogIds();

    expect({
      absentDuCatalogueBackend: frontend.filter((id) => !backend.includes(id)),
      absentDuFrontend: backend.filter((id) => !frontend.includes(id)),
    }).toEqual({ absentDuCatalogueBackend: [], absentDuFrontend: [] });
  });

  it('agrège tous les modules existants dans MODULES', () => {
    // Le descripteur porte le nom du DOSSIER, pas celui de l'identifiant :
    // dossier `calcul` → `calculModule`, alors que son identifiant est `calcul-mental`.
    const expected = declaredModules()
      .map((m) => `${m.folder}Module`)
      .sort();
    expect(manifestModuleNames()).toEqual(expected);
  });

  it("n'attribue pas deux fois le même ordre d'affichage côté backend", () => {
    const source = readFileSync(CATALOG_PATH, 'utf-8');
    const orders = [...source.matchAll(/display_order: (\d+),/g)].map((m) => Number(m[1]));
    expect(orders.filter((o, i) => orders.indexOf(o) !== i)).toEqual([]);
  });
});
