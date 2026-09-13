import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  boiteDuPlateau,
  ECLAIRAGE_BLOQUEE,
  eclairementEncre,
  eclairementFace,
  planDeSuperposition,
  rectangleFace,
  DECALAGE_ETAGE,
  DEMI_UNITE_X,
  DEMI_UNITE_Y,
  EPAISSEUR,
  HAUTEUR_TUILE,
  LARGEUR_TUILE,
} from 'src/modules/mahjong/mahjong.geometrie';
import { FORMES } from 'src/modules/mahjong/formes';

const SCSS = readFileSync(
  join(__dirname, '../modules/mahjong/mahjong.scss'),
  'utf-8',
);
const RENDU = readFileSync(
  join(__dirname, '../modules/mahjong/TuileBloc.tsx'),
  'utf-8',
);
const PLATEAU = readFileSync(
  join(__dirname, '../modules/mahjong/MahjongDifficile.tsx'),
  'utf-8',
);

describe('la projection oblique', () => {
  it('fait du cote d’une tuile EXACTEMENT le decalage d’un etage', () => {
    // La regle qui decide de tout : le cote d'une tuile comble l'espace qui la separe de
    // l'etage du dessous. S'ils different, une pile cesse de ressembler a une colonne,
    // soit les etages flottent, soit ils s'enfoncent l'un dans l'autre.
    expect(EPAISSEUR).toBe(DECALAGE_ETAGE);
  });

  it('decale un etage vers le HAUT et la GAUCHE, du meme pas dans les deux sens', () => {
    const sol = rectangleFace({ x: 4, y: 6, z: 0 });
    const dessus = rectangleFace({ x: 4, y: 6, z: 1 });
    expect(dessus.x).toBe(sol.x - DECALAGE_ETAGE);
    expect(dessus.y).toBe(sol.y - DECALAGE_ETAGE);
  });

  it('ne deforme JAMAIS la face : meme rectangle a tous les etages', () => {
    // C'est tout l'interet d'abandonner la 3D. Une rotation ecrasait les faces
    // verticalement, donc les symboles, la seule chose que l'enfant doit lire.
    for (const z of [0, 1, 2, 3, 4]) {
      const r = rectangleFace({ x: 2, y: 2, z });
      expect({ z, l: r.largeur, h: r.hauteur }).toEqual({
        z,
        l: LARGEUR_TUILE,
        h: HAUTEUR_TUILE,
      });
    }
  });

  it('espace deux voisines d’exactement une largeur de tuile', () => {
    // L'empreinte fait 2 demi-unites : deux tuiles cote a cote se touchent sans se
    // chevaucher, et sans laisser de jour.
    const a = rectangleFace({ x: 0, y: 0, z: 0 });
    const b = rectangleFace({ x: 2, y: 0, z: 0 });
    expect(b.x - a.x).toBe(LARGEUR_TUILE);
    expect(2 * DEMI_UNITE_X).toBe(LARGEUR_TUILE);
    expect(2 * DEMI_UNITE_Y).toBe(HAUTEUR_TUILE);
  });
});

describe('l’ordre de superposition', () => {
  it('suit etage, puis rangee, puis colonne', () => {
    const plan = (x: number, y: number, z: number) => planDeSuperposition({ x, y, z });
    expect(plan(0, 0, 1)).toBeGreaterThan(plan(18, 20, 0)); // l'etage l'emporte
    expect(plan(0, 2, 0)).toBeGreaterThan(plan(18, 0, 0)); // puis la rangee
    expect(plan(4, 0, 0)).toBeGreaterThan(plan(2, 0, 0)); // puis la colonne
  });

  it('ne donne jamais le meme plan a deux cases, sur AUCUNE disposition', () => {
    // Deux tuiles au meme plan se superposeraient dans l'ordre du DOM, donc au hasard.
    for (const forme of FORMES) {
      const plans = forme.slots.map(planDeSuperposition);
      expect({ id: forme.id, uniques: new Set(plans).size }).toEqual({
        id: forme.id,
        uniques: forme.slots.length,
      });
    }
  });

  it('va de gauche a droite dans une rangee, pas l’inverse', () => {
    // Les etages se decalent vers la gauche, donc la camera est a DROITE : dans une
    // rangee, la tuile la plus a droite est la plus proche. Inverser ce signe fait que
    // le cote de chaque tuile vient manger le bord de sa voisine, alors qu'il est
    // physiquement cache par elle.
    expect(planDeSuperposition({ x: 6, y: 0, z: 0 })).toBeGreaterThan(
      planDeSuperposition({ x: 4, y: 0, z: 0 }),
    );
  });
});

describe('la boite du plateau', () => {
  it('compte le relief des bords droit et bas', () => {
    // Sans `EPAISSEUR`, la derniere rangee etait rognee de son propre volume.
    const boite = boiteDuPlateau([{ x: 0, y: 0, z: 0 }]);
    expect(boite.largeur).toBe(LARGEUR_TUILE + EPAISSEUR);
    expect(boite.hauteur).toBe(HAUTEUR_TUILE + EPAISSEUR);
  });

  it('contient toutes les tuiles de toutes les dispositions livrees', () => {
    for (const forme of FORMES) {
      const boite = boiteDuPlateau(forme.slots);
      for (const position of forme.slots) {
        const r = rectangleFace(position);
        expect(r.x).toBeGreaterThanOrEqual(boite.x);
        expect(r.y).toBeGreaterThanOrEqual(boite.y);
        expect(r.x + r.largeur + EPAISSEUR).toBeLessThanOrEqual(boite.x + boite.largeur);
        expect(r.y + r.hauteur + EPAISSEUR).toBeLessThanOrEqual(boite.y + boite.hauteur);
      }
    }
  });

  it('rend une boite vide sans tuile, au lieu d’un infini', () => {
    expect(boiteDuPlateau([])).toEqual({ x: 0, y: 0, largeur: 0, hauteur: 0 });
  });
});

describe('les indices de relief', () => {
  it('assombrit l’encre DEUX FOIS plus vite que la face', () => {
    // Assombrir la face seule mangerait le contraste entre le symbole et son fond.
    // Deplacer l'encre plus vite l'ELARGIT a mesure que les etages s'eloignent : un
    // etage recule est plus contraste que celui du dessus, jamais moins.
    const profondeur = 3;
    const perteFace = 1 - eclairementFace(0, profondeur);
    const perteEncre = 1 - eclairementEncre(0, profondeur);
    expect(perteEncre).toBeCloseTo(2 * perteFace);
  });

  it('laisse l’etage du sommet intact', () => {
    expect(eclairementFace(4, 4)).toBe(1);
    expect(eclairementEncre(4, 4)).toBe(1);
  });

  it('confie l’ombre a `ombrePortee`, qui la fait grandir avec l’etage', () => {
    // Une tuile au sol est POSEE sur la table et garde une ombre courte ; une tuile
    // surelevee flotte au-dessus de l'etage du dessous. C'est cet indice, plus que le
    // dessin du bloc, qui detache les etages - et le seul qui distingue une tuile posee
    // DESSUS d'une tuile haute posee A COTE. Le detail des valeurs est verrouille dans
    // `mahjong-blocage.test.ts`.
    expect(RENDU).toMatch(/const ombre = ombrePortee\(z\)/);
    expect(RENDU).toMatch(/drop-shadow\(\$\{ombre\.x\}px \$\{ombre\.y\}px \$\{ombre\.flou\}px/);
  });
});

describe('ce qui distingue une tuile bloquee', () => {
  it('marque la tuile ENTIERE, et seulement quand elle est bloquee', () => {
    // Le relief dit la HAUTEUR, pas la liberte : une tuile peut etre au sommet de sa
    // pile, bien eclairee, bien detachee, et rester injouable parce qu'elle a une voisine
    // de chaque cote. Sur la Tortue, 23 tuiles sur 144 sont libres au depart : sans cet
    // indice, 121 clics ne repondent pas et rien n'explique pourquoi.
    expect(RENDU).toMatch(/libre\s*\n?\s*\? ''/);
    expect(RENDU).toMatch(/grayscale[^]{0,60}brightness\(\$\{ECLAIRAGE_BLOQUEE\}\)/);
    // Sur le BOUTON, donc face et encre ensemble : les deux luminances bougent du meme
    // facteur, leur rapport ne change pas, et le symbole reste aussi lisible qu'avant.
    // Assombrir la face seule aurait mange le contraste.
    expect(RENDU).toMatch(/filter:\s*\n?\s*`drop-shadow/);
  });

  it('reste franchement visible, sans rendre les bloquees illisibles', () => {
    // Le gros du signal est desormais la DESATURATION ; la luminosite n'est que le
    // second indice, donc elle peut rester douce. Voir `mahjong-blocage.test.ts`.
    expect(ECLAIRAGE_BLOQUEE).toBeLessThan(1);
    expect(ECLAIRAGE_BLOQUEE).toBeGreaterThanOrEqual(0.8);
  });
});

describe('la mise a l’echelle', () => {
  it('donne au cadre la taille REELLE apres reduction', () => {
    // `transform` ne change pas la place qu'un element occupe : une scene de 598 px
    // reduite a 0,47 occupe toujours 598 px. Sans un cadre a la taille reduite, elle
    // debordait du conteneur et le centrage ne s'appliquait plus a rien : le plateau
    // partait dans le coin bas-droite.
    expect(PLATEAU).toMatch(/width: boite\.largeur \* echelle/);
    expect(PLATEAU).toMatch(/height: boite\.hauteur \* echelle/);
    expect(SCSS).toMatch(/transform-origin: top left/);
  });

  it('n’agrandit jamais au-dela de la taille native', () => {
    // Au-dela de 1, les images de tuiles se deliteraient.
    expect(PLATEAU).toMatch(/Math\.min\(1, width \/ largeurPlateau, height \/ hauteurPlateau\)/);
  });

  it('mesure le plateau COMPLET, pas les tuiles restantes', () => {
    // Sinon le plateau se recentre et grandit a chaque paire retiree, et l'enfant perd
    // de vue ou se trouvait ce qu'elle regardait.
    expect(PLATEAU).toMatch(/boiteDuPlateau\(forme\.slots\)/);
  });
});

describe('les deux copies de la geometrie', () => {
  it('gardent les MEMES valeurs en SCSS et en TypeScript', () => {
    // Le decoupage du bloc vit dans la feuille de style, la position des tuiles dans le
    // module : les deux doivent parler de la meme tuile. Une divergence ne casse rien
    // visiblement, elle decale juste le relief d'un pixel ou deux.
    expect(SCSS).toMatch(new RegExp(`\\$tuile-largeur: ${LARGEUR_TUILE}px;`));
    expect(SCSS).toMatch(new RegExp(`\\$tuile-hauteur: ${HAUTEUR_TUILE}px;`));
    expect(SCSS).toMatch(new RegExp(`\\$tuile-epaisseur: ${EPAISSEUR}px;`));
  });
});
