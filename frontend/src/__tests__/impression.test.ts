import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MODULES } from 'src/modules.manifest';

const SCSS = readFileSync(join(__dirname, '../impression/impression.scss'), 'utf-8');
const TRAMES = readFileSync(join(__dirname, '../impression/trames.tsx'), 'utf-8');
const PAGE = readFileSync(join(__dirname, '../impression/ImpressionPage.tsx'), 'utf-8');

const fournisseurs = MODULES.filter((m) => m.impression);

describe('le catalogue imprimable', () => {
  it('ne declare que des exercices complets', () => {
    for (const module of fournisseurs) {
      for (const exercice of module.impression!.exercices) {
        expect({ module: module.id, cle: exercice.cle, ok: exercice.label.length > 0 }).toEqual({
          module: module.id,
          cle: exercice.cle,
          ok: true,
        });
        expect(exercice.enonce).toBeTypeOf('function');
        expect(exercice.reponse).toBeTypeOf('function');
      }
    }
  });

  it('ne donne jamais deux fois la meme cle', () => {
    // La cle `module/exercice` sert a retrouver le rendu d'un item : un doublon ferait
    // dessiner le mauvais exercice.
    const cles = fournisseurs.flatMap((m) =>
      m.impression!.exercices.map((e) => `${m.id}/${e.cle}`),
    );
    expect(new Set(cles).size).toBe(cles.length);
  });

  it('n’apparait pas chez les modules qui n’ont rien a imprimer', () => {
    // Un jeu n'a pas de feuille d'exercices. Absent = absent de la page de composition.
    for (const id of ['morpion', 'puissance4', 'mahjong', 'memory', 'snake']) {
      expect({ id, imprimable: !!MODULES.find((m) => m.id === id)?.impression }).toEqual({
        id,
        imprimable: false,
      });
    }
  });
});

describe('la feuille est un objet PHYSIQUE', () => {
  it('se mesure en millimetres, jamais en pixels', () => {
    // Le millimetre est la seule unite que l'imprimante respecte. Une feuille reglee en
    // pixels depend du zoom, de la densite d'ecran et du navigateur.
    expect(SCSS).toMatch(/@page\s*\{[^}]*size: A4 portrait/);
    expect(SCSS).toMatch(/\$largeur-utile: 186mm/);
    expect(TRAMES).not.toMatch(/px/);
  });

  it('garde la reglure Seyes a ses vraies mesures', () => {
    // Interligne de 2 mm, ligne forte tous les 8 mm, verticales tous les 8 mm. Ce sont
    // les mesures du cahier : approximatives, elles ne servent plus a rien.
    expect(SCSS).toMatch(/transparent 0\.15mm 2mm/);
    expect(SCSS).toMatch(/transparent 0\.25mm 8mm/);
    expect(SCSS).toMatch(/transparent 0\.15mm 8mm/);
  });

  it('quadrille a 5 mm, la trame des maths', () => {
    expect(SCSS).toMatch(/transparent 0\.15mm 5mm/);
  });

  it('ne coupe jamais un exercice entre deux pages', () => {
    expect(SCSS).toMatch(/break-inside: avoid/);
  });

  it('envoie le corrige sur sa propre page', () => {
    // Detachable, et hors de sa vue pendant qu'elle travaille : c'est ce qui lui permet
    // de se corriger seule apres coup.
    expect(SCSS).toMatch(/&__corrige \{[^}]*break-before: page/);
  });

  it('n’imprime pas les reglages', () => {
    expect(SCSS).toMatch(/@media print/);
    expect(SCSS).toMatch(/\.Impression__reglages,/);
  });
});

describe('ou vit la composition', () => {
  it('est dans l’administration, pas sur l’ecran de l’enfant', () => {
    // Imprimer demande une imprimante, du papier, et de decider ce qu'on fait
    // travailler. A sept ans elle ne fait rien de tout ca.
    const routeur = readFileSync(join(__dirname, '../routes/router.tsx'), 'utf-8');
    expect(routeur).toMatch(/path: 'impression'/);
    const blocAdmin = routeur.slice(routeur.indexOf("path: '/admin'"));
    expect(blocAdmin).toMatch(/path: 'impression'/);
  });

  it('retire deux feuilles DIFFERENTES a deux preparations', () => {
    // Pas de memorisation des compositions, et surtout pas de cache : la meme demande
    // doit donner d'autres exercices. D'ou une mutation et non une requete.
    const api = readFileSync(join(__dirname, '../impression/impression.api.ts'), 'utf-8');
    expect(api).toMatch(/builder\.mutation/);
    expect(PAGE).toMatch(/useComposerFeuilleMutation/);
  });
});
