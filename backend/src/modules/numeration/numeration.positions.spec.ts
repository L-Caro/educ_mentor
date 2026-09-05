import {
  DEFAULT_ACTIVE_POSITIONS,
  POSITIONS,
  chiffreA,
  exposantMin,
  formater,
  maximum,
  pas,
  trierPositions,
  type PositionKey,
} from './numeration.positions';
import { NIVEAUX } from '../../common/niveau';

/**
 * L'arithmétique des positions, et surtout celle des décimaux.
 *
 * Représenter 3,45 en flottant ferait échouer les comparaisons sur des arrondis, et la
 * comparaison des décimaux EST la notion : un enfant de CM1 croit spontanément que
 * 3,45 > 3,5 parce que 45 > 5. Un module qui se tromperait lui-même là-dessus enseignerait
 * exactement l'erreur qu'il est censé corriger.
 *
 * Tout circule donc en entiers d'unité la plus petite, et la virgule n'apparaît qu'à
 * l'affichage.
 */

describe('catalogue des positions', () => {
  it('va des millièmes aux centaines de millions', () => {
    const exposants = POSITIONS.map((p) => p.exposant);
    expect(Math.min(...exposants)).toBe(-3);
    expect(Math.max(...exposants)).toBe(8);
  });

  it('ordonne les positions du plus petit au plus grand exposant', () => {
    const exposants = POSITIONS.map((p) => p.exposant);
    expect(exposants).toEqual([...exposants].sort((a, b) => a - b));
  });

  it("n'ouvre que les unités et les dizaines à l'installation", () => {
    expect(DEFAULT_ACTIVE_POSITIONS).toEqual(['u', 'd']);
  });

  it('étiquette chaque position d’une classe connue', () => {
    for (const position of POSITIONS) {
      expect(NIVEAUX).toContain(position.niveau);
    }
  });

  it('trie une liste donnée dans le désordre', () => {
    expect(trierPositions(['c', 'millieme', 'd'])).toEqual([
      'millieme',
      'd',
      'c',
    ]);
  });
});

describe('arithmétique entière', () => {
  it('garde l’unité de base à 1 quand aucun décimal n’est ouvert', () => {
    const entiers: PositionKey[] = ['u', 'd', 'c'];
    expect(exposantMin(entiers)).toBe(0);
    expect(pas('c', 0)).toBe(100);
    expect(maximum(entiers)).toBe(999);
  });

  it('descend l’unité de base quand un décimal est ouvert', () => {
    // Avec les centièmes, tout s'exprime en centièmes : l'unité vaut 100.
    const avecCentiemes: PositionKey[] = ['centieme', 'dixieme', 'u'];
    expect(exposantMin(avecCentiemes)).toBe(-2);
    expect(pas('u', -2)).toBe(100);
    expect(pas('dixieme', -2)).toBe(10);
    expect(pas('centieme', -2)).toBe(1);
    expect(maximum(avecCentiemes)).toBe(999); // 9,99
  });

  it('extrait le bon chiffre, décimales comprises', () => {
    // 3,45 = 345 centièmes
    expect(chiffreA(345, 'u', -2)).toBe(3);
    expect(chiffreA(345, 'dixieme', -2)).toBe(4);
    expect(chiffreA(345, 'centieme', -2)).toBe(5);
  });

  it('extrait le bon chiffre dans les millions', () => {
    expect(chiffreA(123456789, 'mi', 0)).toBe(3);
    expect(chiffreA(123456789, 'dmi', 0)).toBe(2);
    expect(chiffreA(123456789, 'cmi', 0)).toBe(1);
    expect(chiffreA(123456789, 'u', 0)).toBe(9);
  });
});

describe('affichage', () => {
  it('écrit un entier sans virgule', () => {
    expect(formater(999, 0)).toBe('999');
    expect(formater(1000000, 0)).toBe('1000000');
  });

  it('place la virgule française, pas le point', () => {
    expect(formater(345, -2)).toBe('3,45');
    expect(formater(7, -1)).toBe('0,7');
  });

  it('garde les zéros de tête de la partie décimale', () => {
    // 305 centièmes s'écrit 3,05 : pas 3,5. C'est exactement l'erreur à ne pas commettre.
    expect(formater(305, -2)).toBe('3,05');
    expect(formater(5, -2)).toBe('0,05');
    expect(formater(1005, -3)).toBe('1,005');
  });

  it('affiche un décimal entier avec ses décimales', () => {
    expect(formater(300, -2)).toBe('3,00');
  });
});

describe('le piège des décimaux', () => {
  it('ordonne 3,45 et 3,5 correctement, sans flottant', () => {
    // L'erreur classique du CM1 : croire que 3,45 > 3,5 parce que 45 > 5. En centièmes,
    // 345 < 350, et la comparaison est exacte par construction.
    const troisQuaranteCinq = 345;
    const troisCinq = 350;
    expect(troisQuaranteCinq).toBeLessThan(troisCinq);
    expect(formater(troisQuaranteCinq, -2)).toBe('3,45');
    expect(formater(troisCinq, -2)).toBe('3,50');
  });

  it('ne perd rien sur une somme que les flottants raterait', () => {
    // 0,1 + 0,2 en flottant vaut 0,30000000000000004. En dixièmes, 1 + 2 = 3.
    expect(formater(1 + 2, -1)).toBe('0,3');
  });
});
