import { describe, expect, it } from 'vitest';
import {
  compterBlocs,
  executer,
  reussi,
  tourner,
} from './programmation.interprete';
import { ETAPES, bloc, engendrerNiveau } from './programmation.niveaux';
import { PARCOURS, type Niveau } from './programmation.types';

/** Les tailles que le pre-jeu propose. Le generateur doit tenir sur toutes : c'est la
 * petite grille qui casse, jamais la grande. */
const COTES = [5, 6, 7, 8];

describe('le generateur', () => {
  it('rend des niveaux SOLUBLES, sur toutes les tailles et les deux parcours', () => {
    // La promesse centrale du module. Un niveau insoluble, personne ne peut le savoir
    // avant d'avoir cherche longtemps : a sept ans on en conclut qu'on est nul, pas que
    // le jeu est casse. Chaque niveau est donc rejoue par l'interprete a l'engendrement,
    // et ce test le verifie sur un large echantillon.
    const manques: string[] = [];
    for (const parcours of PARCOURS) {
      for (const cote of COTES) {
        for (const etape of ETAPES) {
          for (let essai = 0; essai < 12; essai++) {
            const niveau = engendrerNiveau(etape, cote, parcours);
            if (!niveau) {
              manques.push(`${parcours} ${String(cote)} etape ${String(etape.rang)}`);
              continue;
            }
            if (!reussi(niveau, executer(niveau, niveau.solution))) {
              manques.push(`INSOLUBLE ${parcours} ${String(cote)} e${String(etape.rang)}`);
            }
          }
        }
      }
    }
    expect(manques).toEqual([]);
  });

  it('ne pose jamais un mur SUR le chemin, ni sur le but', () => {
    for (let essai = 0; essai < 40; essai++) {
      const niveau = engendrerNiveau(ETAPES[5], 7, 'robot');
      expect(niveau).not.toBeNull();
      const n = niveau as Niveau;
      for (const mur of n.murs) {
        expect({ mur, depart: n.depart }).not.toEqual({ mur, depart: mur });
        expect({ mur, but: n.but }).not.toEqual({ mur, but: mur });
      }
    }
  });

  it('ne pose pas de graine sur le BUT', () => {
    // Ramasser et arriver au meme instant demande de comprendre deux choses a la fois, et
    // laisse croire qu'on a gagne alors qu'il reste un ordre a donner.
    for (let essai = 0; essai < 40; essai++) {
      const niveau = engendrerNiveau(ETAPES[3], 6, 'enfant');
      const n = niveau as Niveau;
      for (const graine of n.graines) {
        expect({ graine, but: n.but }).not.toEqual({ graine, but: graine });
      }
    }
  });

  it('ne propose QUE les blocs de l’etape', () => {
    // Une palette qui offrirait tout des le premier niveau noierait ce qu'on cherche a
    // montrer : la repetition ne veut rien dire tant que la file est courte.
    const premier = engendrerNiveau(ETAPES[0], 6, 'enfant') as Niveau;
    expect(premier.blocs).toEqual([
      'aller_nord',
      'aller_est',
      'aller_sud',
      'aller_ouest',
    ]);
  });

  it('bride assez pour rendre la repetition NECESSAIRE', () => {
    // Sans bride, on aligne quinze « avance » et la boucle ne sert a rien : elle doit
    // arriver comme un soulagement, pas comme une consigne.
    for (let essai = 0; essai < 20; essai++) {
      const niveau = engendrerNiveau(ETAPES[2], 7, 'robot') as Niveau;
      expect(niveau.maximumBlocs).toBeDefined();
      expect(niveau.maximumBlocs!).toBeLessThan(niveau.solution.length);
    }
  });
});

describe('l’interprete', () => {
  const plateau = (): Niveau => ({
    etape: 1,
    titre: 't',
    consigne: 'c',
    colonnes: 4,
    lignes: 4,
    depart: { x: 0, y: 3 },
    directionDepart: 'est',
    but: { x: 3, y: 3 },
    murs: [{ x: 2, y: 3 }],
    graines: [],
    blocs: [],
    solution: [],
  });

  it('arrete le personnage AU MUR, sans le traverser', () => {
    const niveau = plateau();
    const trace = executer(niveau, [
      bloc('aller_est'),
      bloc('aller_est'),
      bloc('aller_est'),
    ]);
    const fin = trace[trace.length - 1];
    expect({ position: fin.position, incident: fin.incident }).toEqual({
      position: { x: 1, y: 3 },
      incident: 'mur',
    });
  });

  it('arrete le personnage AU BORD', () => {
    const niveau = plateau();
    const trace = executer(niveau, [bloc('aller_sud')]);
    expect(trace[trace.length - 1].incident).toBe('dehors');
  });

  it('n’execute RIEN apres un incident', () => {
    // Sinon le personnage repart apres etre entre dans le mur, et l'enfant voit une
    // suite qui n'a aucun rapport avec ce qu'elle a ecrit.
    const niveau = plateau();
    const trace = executer(niveau, [
      bloc('aller_sud'),
      bloc('aller_nord'),
      bloc('aller_nord'),
    ]);
    expect(trace).toHaveLength(2);
  });

  it('tourne du cote du PERSONNAGE, pas de l’ecran', () => {
    // Le coeur du parcours « robot » : vers le sud, la gauche du personnage est l'est de
    // l'ecran. C'est cette inversion qui perd, et elle doit etre juste.
    expect(tourner('sud', 'gauche')).toBe('est');
    expect(tourner('sud', 'droite')).toBe('ouest');
    expect(tourner('nord', 'gauche')).toBe('ouest');
  });

  it('borne les repetitions imbriquees plutot que de figer l’onglet', () => {
    const niveau = plateau();
    const trace = executer(niveau, [
      bloc('repeter', {
        fois: 99,
        corps: [bloc('repeter', { fois: 99, corps: [bloc('tourner_droite')] })],
      }),
    ]);
    expect(trace[trace.length - 1].incident).toBe('trop_long');
  });

  it('compte les blocs des CORPS dans le total', () => {
    // C'est ce nombre que la bride limite : ne compter que le premier niveau laisserait
    // contourner la limite en imbriquant.
    expect(
      compterBlocs([
        bloc('repeter', {
          fois: 3,
          corps: [bloc('avancer'), bloc('tourner_droite')],
        }),
      ]),
    ).toBe(3);
  });

  it('ne fait pas perdre quand on ramasse dans le vide', () => {
    // Une condition mal placee doit pouvoir se voir sans faire perdre : c'est un ordre
    // sans effet, pas une faute.
    const niveau = plateau();
    const trace = executer(niveau, [bloc('ramasser')]);
    expect(trace[trace.length - 1].incident).toBeUndefined();
  });
});
