import { describe, expect, it } from 'vitest';
import {
  FIGURES,
  ORDRE_FIGURES,
  degre,
  dureeTotale,
  hauteurDe,
  instants,
  lignesSupplementaires,
  mesureJuste,
  nomDe,
  nomSilence,
  positionDe,
  surUneLigne,
  syllabes,
  temps,
  type Evenement,
} from './solfege';

/** Le do du milieu du clavier : la note charnière des deux clés. */
const DO_DU_MILIEU = degre(4, 0);

describe('les hauteurs sur la portée', () => {
  it('nomme les sept notes en boucle, dans les deux sens', () => {
    expect(nomDe(DO_DU_MILIEU)).toBe('do');
    expect(nomDe(DO_DU_MILIEU + 4)).toBe('sol');
    expect(nomDe(DO_DU_MILIEU + 7)).toBe('do');
    // Vers le grave, le modulo ne doit pas rendre un rang négatif.
    expect(nomDe(DO_DU_MILIEU - 1)).toBe('si');
    expect(nomDe(DO_DU_MILIEU - 7)).toBe('do');
  });

  it('pose la clé de sol et la clé de fa là où elles se posent vraiment', () => {
    // La clé de sol s'enroule autour de la DEUXIÈME ligne, qui porte donc un sol.
    expect(nomDe(hauteurDe(2, 'sol'))).toBe('sol');
    // La clé de fa encadre la QUATRIÈME ligne, qui porte un fa.
    expect(nomDe(hauteurDe(6, 'fa'))).toBe('fa');
    // Et la ligne du bas : mi en clé de sol, sol en clé de fa.
    expect(nomDe(hauteurDe(0, 'sol'))).toBe('mi');
    expect(nomDe(hauteurDe(0, 'fa'))).toBe('sol');
  });

  it('LIT LE MÊME DESSIN AUTREMENT selon la clé : c’est tout le piège', () => {
    // Une note posée au même endroit ne porte pas le même nom. Rien sur la page ne le
    // montre : il faut regarder la clé. C'est exactement ce que l'exercice travaille.
    for (let position = -2; position <= 10; position++) {
      const enSol = nomDe(hauteurDe(position, 'sol'));
      const enFa = nomDe(hauteurDe(position, 'fa'));
      expect(enSol).not.toBe(enFa);
    }
  });

  it('place le do du milieu juste sous la clé de sol et juste au-dessus de la clé de fa', () => {
    // C'est la note qui relie les deux portées : une ligne supplémentaire de chaque côté.
    expect(positionDe(DO_DU_MILIEU, 'sol')).toBe(-2);
    expect(positionDe(DO_DU_MILIEU, 'fa')).toBe(10);
  });

  it('fait l’aller-retour entre une hauteur et sa position', () => {
    for (const cle of ['sol', 'fa'] as const) {
      for (let position = -6; position <= 14; position++) {
        expect(positionDe(hauteurDe(position, cle), cle)).toBe(position);
      }
    }
  });

  it('distingue une note posée SUR une ligne d’une note posée entre deux', () => {
    expect(surUneLigne(0)).toBe(true);
    expect(surUneLigne(1)).toBe(false);
    expect(surUneLigne(8)).toBe(true);
    expect(surUneLigne(-2)).toBe(true);
  });
});

describe('les lignes supplémentaires', () => {
  it('n’en trace aucune tant qu’on reste dans la portée', () => {
    for (let position = 0; position <= 8; position++) {
      expect(lignesSupplementaires(position)).toEqual([]);
    }
  });

  it('en trace une par ligne franchie, vers le grave comme vers l’aigu', () => {
    expect(lignesSupplementaires(-2)).toEqual([-2]);
    expect(lignesSupplementaires(-4)).toEqual([-2, -4]);
    expect(lignesSupplementaires(10)).toEqual([10]);
    expect(lignesSupplementaires(12)).toEqual([10, 12]);
  });

  it('trace la ligne du dessous pour une note posée dans un interligne hors portée', () => {
    // Une note en -3 est SOUS la ligne -2 : c'est celle-là qu'on trace, et pas une ligne
    // en -3, qui n'existe pas. Sans elle, la note flotte et on ne sait plus la compter.
    expect(lignesSupplementaires(-3)).toEqual([-2]);
    expect(lignesSupplementaires(11)).toEqual([10]);
  });
});

describe('les durées', () => {
  it('donne à chaque figure son silence jumeau', () => {
    // Le cœur du système : chaque durée existe en deux versions, une qui sonne et une
    // qui se tait. « Soupir » n'est pas une note bizarre, c'est le silence d'une noire.
    expect(nomSilence('noire')).toBe('soupir');
    expect(nomSilence('blanche')).toBe('demi-pause');
    expect(nomSilence('ronde')).toBe('pause');
    expect(nomSilence('croche')).toBe('demi-soupir');
  });

  it('divise par deux à chaque figure plus courte', () => {
    for (let i = 1; i < ORDRE_FIGURES.length; i++) {
      const avant = temps(ORDRE_FIGURES[i - 1]);
      const apres = temps(ORDRE_FIGURES[i]);
      expect(apres).toBe(avant / 2);
    }
    expect(temps('noire')).toBe(1);
  });

  it('donne un silence à toutes les figures, sans exception', () => {
    for (const figure of ORDRE_FIGURES) {
      expect(FIGURES[figure].silence.length).toBeGreaterThan(0);
    }
  });
});

describe('le langage rythmique de son cours', () => {
  it('donne UNE syllabe PAR TEMPS, et non par figure', () => {
    // Relevé sur son cahier : « Taé » sur l'attaque, « aé » sur le temps qui prolonge,
    // « Aé » sur le temps qui se tait. C'est ce découpage par temps qui fait qu'une
    // blanche dit deux syllabes et pas une.
    expect(syllabes({ figure: 'noire', silence: false })).toBe('Taé');
    expect(syllabes({ figure: 'blanche', silence: false })).toBe('Taéaé');
    expect(syllabes({ figure: 'ronde', silence: false })).toBe('Taéaéaéaé');
    expect(syllabes({ figure: 'noire', silence: true })).toBe('Aé');
    expect(syllabes({ figure: 'blanche', silence: true })).toBe('AéAé');
  });

  it('ne dit RIEN en dessous du temps', () => {
    // Les croches n'ont pas encore été vues en cours, et leur syllabe ne se devine pas :
    // en inventer une travaillerait contre sa professeure.
    expect(syllabes({ figure: 'croche', silence: false })).toBe('');
    expect(syllabes({ figure: 'doubleCroche', silence: true })).toBe('');
  });
});

describe('les mesures', () => {
  const noire: Evenement = { figure: 'noire', silence: false };
  const soupir: Evenement = { figure: 'noire', silence: true };
  const blanche: Evenement = { figure: 'blanche', silence: false };

  it('compte un silence comme une note : il occupe le temps, il ne l’efface pas', () => {
    expect(dureeTotale([noire, soupir, noire, soupir])).toBe(4);
  });

  it('reconnaît une mesure juste et une mesure fausse', () => {
    expect(mesureJuste([blanche, noire, noire], 4)).toBe(true);
    expect(mesureJuste([blanche, noire], 4)).toBe(false);
    expect(mesureJuste([blanche, noire], 3)).toBe(true);
  });

  it('ne trébuche pas sur les demis et les quarts', () => {
    // Quatre doubles croches font une noire, mais en virgule flottante la somme ne tombe
    // pas toujours pile : une comparaison stricte refuserait une mesure juste.
    const doubles = Array.from({ length: 16 }, () => ({
      figure: 'doubleCroche' as const,
      silence: false,
    }));
    expect(mesureJuste(doubles, 4)).toBe(true);
  });

  it('dit à quel temps tombe chaque figure', () => {
    // Sans cela, impossible de savoir si elle a tapé à l'heure : on ne connaît pas
    // l'heure.
    expect(instants([noire, blanche, noire])).toEqual([0, 1, 3]);
    expect(
      instants([
        { figure: 'croche', silence: false },
        { figure: 'croche', silence: false },
        { figure: 'noire', silence: false },
      ]),
    ).toEqual([0, 0.5, 1]);
  });
});
