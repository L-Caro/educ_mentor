import { nombreEnLettres } from './numeration.lettres';

describe('nombreEnLettres', () => {
  it('ecrit les petits nombres', () => {
    const attendus: [number, string][] = [
      [0, 'zéro'],
      [1, 'un'],
      [11, 'onze'],
      [16, 'seize'],
      [17, 'dix-sept'],
      [19, 'dix-neuf'],
      [20, 'vingt'],
    ];
    for (const [n, mot] of attendus)
      expect([n, nombreEnLettres(n)]).toEqual([n, mot]);
  });

  it('ecrit « et un » sans trait d’union, et seulement la', () => {
    // La seule liaison que le francais ecrit ainsi. Partout ailleurs, un trait d'union.
    expect(nombreEnLettres(21)).toBe('vingt et un');
    expect(nombreEnLettres(31)).toBe('trente et un');
    expect(nombreEnLettres(22)).toBe('vingt-deux');
    expect(nombreEnLettres(81)).toBe('quatre-vingt-un');
    expect(nombreEnLettres(101)).toBe('cent un');
  });

  it('compte par vingt de 70 a 99, comme le francais', () => {
    expect(nombreEnLettres(70)).toBe('soixante-dix');
    expect(nombreEnLettres(71)).toBe('soixante et onze');
    expect(nombreEnLettres(72)).toBe('soixante-douze');
    expect(nombreEnLettres(79)).toBe('soixante-dix-neuf');
    expect(nombreEnLettres(90)).toBe('quatre-vingt-dix');
    expect(nombreEnLettres(91)).toBe('quatre-vingt-onze');
    expect(nombreEnLettres(99)).toBe('quatre-vingt-dix-neuf');
  });

  it('accorde vingt et cent seulement quand ils TERMINENT le nombre', () => {
    // C'est le piege orthographique le plus courant, et la raison d'etre de l'exercice.
    expect(nombreEnLettres(80)).toBe('quatre-vingts');
    expect(nombreEnLettres(82)).toBe('quatre-vingt-deux');
    expect(nombreEnLettres(200)).toBe('deux cents');
    expect(nombreEnLettres(203)).toBe('deux cent trois');
    expect(nombreEnLettres(100)).toBe('cent');
    expect(nombreEnLettres(180)).toBe('cent quatre-vingts');
  });

  it('laisse mille INVARIABLE, contrairement a million', () => {
    expect(nombreEnLettres(1000)).toBe('mille');
    expect(nombreEnLettres(2000)).toBe('deux mille');
    // `quatre-vingts` perd son s des que quelque chose suit, meme « mille ».
    expect(nombreEnLettres(80000)).toBe('quatre-vingt mille');
    expect(nombreEnLettres(200000)).toBe('deux cent mille');
    expect(nombreEnLettres(1_000_000)).toBe('un million');
    expect(nombreEnLettres(2_000_000)).toBe('deux millions');
  });

  it('assemble les nombres longs', () => {
    expect(nombreEnLettres(4385)).toBe(
      'quatre mille trois cent quatre-vingt-cinq',
    );
    expect(nombreEnLettres(1_234_567)).toBe(
      'un million deux cent trente-quatre mille cinq cent soixante-sept',
    );
  });

  it('refuse ce qu’elle ne sait pas ecrire', () => {
    expect(() => nombreEnLettres(-1)).toThrow();
    expect(() => nombreEnLettres(1.5)).toThrow();
  });
});
