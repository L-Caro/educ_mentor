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

describe('les reglages par exercice', () => {
  it('laisse choisir ce qu’on travaille, la ou ca a du sens', () => {
    // Sans reglages, une feuille de tables sort les onze tables melangees et une feuille
    // de grammaire toutes les notions ouvertes. C'est utilisable, mais ca ne permet pas
    // de travailler ce qu'on VEUT travailler, qui est le seul interet d'une feuille faite
    // a la main plutot que tiree au hasard.
    // Les reglages portent sur le CONTENU et valent pour tous les types du module : les
    // tables a travailler sont les memes qu'on demande un produit ou une suite.
    const attendus: Record<string, string[]> = {
      tables: ['tables'],
      'calcul-mental': ['types'],
      conjugaison: ['formes', 'verbes', 'tenses'],
      accords: ['types'],
      grammaire: ['types'],
    };
    for (const [moduleId, cles] of Object.entries(attendus)) {
      const module = MODULES.find((m) => m.id === moduleId);
      expect({
        moduleId,
        options: module?.impression?.options?.map((o) => o.cle).sort(),
      }).toEqual({ moduleId, options: [...cles].sort() });
    }
  });

  it('borne le nombre de formes d’une conjugaison entre une et six', () => {
    const formes = MODULES.find((m) => m.id === 'conjugaison')
      ?.impression?.options?.find((o) => o.cle === 'formes');
    expect(formes).toMatchObject({ type: 'nombre', min: 1, max: 6 });
  });

  it('ne propose QUE des listes chargees ou statiques, jamais les deux', () => {
    // Une option qui porterait les deux laisserait deux sources de verite sur ce qui est
    // proposable, et la statique gagnerait en silence.
    for (const module of fournisseurs) {
      for (const option of module.impression!.options ?? []) {
        if (option.type !== 'multi') continue;
        expect({
          cle: option.cle,
          uneSeule: Boolean(option.choix) !== Boolean(option.charger),
        }).toEqual({ cle: option.cle, uneSeule: true });
      }
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
    // Interligne de 2 mm, quatre par groupe, donc une ligne forte tous les 8 mm. Ce sont
    // les mesures de son cahier : approximatives, elles ne servent plus a rien.
    expect(SCSS).toMatch(/&__interligne \{[^}]*height: 2mm/);
    expect(TRAMES).toMatch(/Seyes__interligne--forte/);
    // On compte les OUVERTURES de classe : `Seyes__interligne--forte` contient deja le
    // nom de base, et compter les occurrences nues en donnait cinq pour quatre divs.
    const groupe = TRAMES.slice(TRAMES.indexOf('Seyes__groupe'));
    expect(groupe.match(/"Seyes__interligne/g)?.length).toBe(4);
  });

  it('quadrille a 5 mm, la trame des maths', () => {
    expect(SCSS).toMatch(/&__case \{[^}]*height: 5mm/);
    expect(TRAMES).toMatch(/repeat\(\$\{colonnes\}, 5mm\)/);
  });

  it('dessine les trames en BORDURES, jamais en fonds', () => {
    // Chrome n'imprime pas les fonds tant que « Graphiques d'arriere-plan » n'est pas
    // coche, et cette case est DECOCHEE par defaut. Une premiere version utilisait des
    // `repeating-linear-gradient` : la feuille serait sortie vierge, et l'enfant aurait
    // eu une page blanche numerotee. Une bordure fait partie du contenu et s'imprime
    // toujours.
    const trames = SCSS.slice(SCSS.indexOf('.Seyes {'), SCSS.indexOf('.LignesEcriture'));
    expect(trames).not.toMatch(/background/);
    expect(trames).toMatch(/border-bottom: 0\.15mm solid/);
  });

  it('ne coupe jamais un exercice entre deux pages', () => {
    expect(SCSS).toMatch(/break-inside: avoid/);
  });

  it('envoie le corrige sur sa propre page', () => {
    // Detachable, et hors de sa vue pendant qu'elle travaille : c'est ce qui lui permet
    // de se corriger seule apres coup.
    expect(SCSS).toMatch(/&__corrige \{[^}]*break-before: page/);
  });

  it('n’imprime QUE la feuille', () => {
    // Tout est masque, puis la feuille seule est rouverte. Une premiere version masquait
    // `body > *:not(.Impression__racine)` : le premier enfant de `body` est la racine
    // React, qui ne porte pas cette classe, et l'apercu sortait VIERGE. Et `visibility`
    // plutot que `display` : `display: none` sur un ancetre emporte ses descendants quoi
    // qu'on dise plus bas.
    const bloc = SCSS.slice(SCSS.indexOf('@media print'));
    expect(bloc).toMatch(/body \* \{\s*visibility: hidden/);
    expect(bloc).toMatch(/\.Feuille,\s*\n\s*\.Feuille \* \{\s*visibility: visible/);
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
