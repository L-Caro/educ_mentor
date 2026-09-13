import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { estLibre, raisonDuBlocage } from 'src/modules/mahjong/tourelle';
import { FORMES } from 'src/modules/mahjong/formes';

const TUILE = readFileSync(
  join(__dirname, '../modules/mahjong/TuileBloc.tsx'),
  'utf-8',
);
const PLATEAU = readFileSync(
  join(__dirname, '../modules/mahjong/MahjongDifficile.tsx'),
  'utf-8',
);

describe('pourquoi une tuile est refusee', () => {
  it('ne reproche rien a une tuile jouable', () => {
    expect(raisonDuBlocage([{ x: 0, y: 0, z: 0 }], { x: 0, y: 0, z: 0 })).toEqual({
      cause: null,
      bloqueurs: [],
    });
  });

  it('designe la tuile posee DESSUS, et elle seule', () => {
    const dessous = { x: 2, y: 2, z: 0 };
    const dessus = { x: 2, y: 2, z: 1 };
    const aCote = { x: 4, y: 2, z: 0 };
    const raison = raisonDuBlocage([dessous, dessus, aCote], dessous);
    expect(raison.cause).toBe('dessus');
    expect(raison.bloqueurs).toEqual([dessus]);
  });

  it('designe les DEUX cotes, parce qu’un seul degage suffirait', () => {
    const milieu = { x: 4, y: 0, z: 0 };
    const gauche = { x: 2, y: 0, z: 0 };
    const droite = { x: 6, y: 0, z: 0 };
    const raison = raisonDuBlocage([gauche, milieu, droite], milieu);
    expect(raison.cause).toBe('cotes');
    expect(raison.bloqueurs).toEqual([gauche, droite]);
  });

  it('ne reproche rien quand un seul cote est pris', () => {
    const milieu = { x: 4, y: 0, z: 0 };
    const gauche = { x: 2, y: 0, z: 0 };
    expect(raisonDuBlocage([gauche, milieu], milieu).cause).toBeNull();
  });

  it('dit la meme chose que `estLibre`, sur les dix dispositions', () => {
    // Deux fonctions, une seule verite : si elles divergeaient, le jeu refuserait une
    // tuile sans savoir quoi montrer, ou en designerait une qu'il accepte.
    for (const forme of FORMES) {
      for (const position of forme.slots) {
        const libre = estLibre(forme.slots, position);
        const raison = raisonDuBlocage(forme.slots, position);
        expect({ id: forme.id, position, coherent: libre === (raison.cause === null) }).toEqual({
          id: forme.id,
          position,
          coherent: true,
        });
      }
    }
  });
});

describe('ce qui rend l’explication necessaire', () => {
  it('bloque surtout par des voisines EN DIAGONALE, invisibles a la lecture', () => {
    // C'est le chiffre qui justifie toute la fonctionnalite, et qui doit empecher de la
    // retirer en la croyant superflue. Ces dispositions sont posees en quinconce : la
    // voisine qui bloque est le plus souvent decalee d'une demi-tuile, donc en bas ou en
    // haut a droite. L'enfant voit une tuile qui n'a « rien a droite » et le jeu la
    // refuse.
    let pileACote = 0;
    let enDiagonale = 0;
    for (const forme of FORMES) {
      for (const position of forme.slots) {
        const raison = raisonDuBlocage(forme.slots, position);
        if (raison.cause !== 'cotes') continue;
        for (const bloqueur of raison.bloqueurs) {
          if (bloqueur.y === position.y) pileACote++;
          else enDiagonale++;
        }
      }
    }
    expect(enDiagonale).toBeGreaterThan(pileACote * 3);
  });

  it('laisse une tuile bloquee CLIQUABLE, pour pouvoir l’expliquer', () => {
    // `disabled` la rendait inerte : l'enfant restait devant une tuile muette.
    // `(?<!aria-)` est necessaire : sans lui, `\b` tombe aussi apres le tiret de
    // `aria-disabled`, et le test se validait tout seul.
    expect(TUILE).not.toMatch(/(?<!aria-)disabled=\{/);
    expect(TUILE).toMatch(/aria-disabled=\{!libre\}/);
    expect(PLATEAU).toMatch(/raisonDuBlocage\(cases, cliquee\)/);
  });

  it('ne compte pas ce clic comme un essai', () => {
    // Il n'y avait rien a tenter : gonfler le compteur punirait une question.
    const avantEssais = PLATEAU.indexOf('setEssais((valeur) => valeur + 1)');
    const blocage = PLATEAU.indexOf('setBlocage({ cause: raison.cause');
    expect(blocage).toBeGreaterThan(-1);
    expect(blocage).toBeLessThan(avantEssais);
  });
});
