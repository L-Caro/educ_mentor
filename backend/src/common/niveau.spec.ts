import {
  NIVEAUX,
  NIVEAU_LABEL,
  isNiveau,
  rangNiveau,
  trierParNiveau,
  type Niveau,
} from './niveau';

describe('niveau scolaire', () => {
  it('va du CP au CM2, dans l’ordre du programme', () => {
    expect(NIVEAUX).toEqual(['cp', 'ce1', 'ce2', 'cm1', 'cm2']);
    expect(rangNiveau('cp')).toBeLessThan(rangNiveau('cm2'));
  });

  it('a un libellé pour chaque niveau', () => {
    for (const niveau of NIVEAUX) {
      expect(NIVEAU_LABEL[niveau]).toBeTruthy();
    }
  });

  it('reconnaît un niveau valide', () => {
    expect(isNiveau('ce2')).toBe(true);
    expect(isNiveau('CE2')).toBe(false);
    expect(isNiveau(null)).toBe(false);
  });

  it('trie par niveau croissant, sans bousculer l’ordre à niveau égal', () => {
    const entrees: { key: string; niveau: Niveau }[] = [
      { key: 'passe-simple', niveau: 'cm1' },
      { key: 'present', niveau: 'cp' },
      { key: 'imparfait', niveau: 'ce1' },
      { key: 'futur', niveau: 'ce1' },
    ];
    expect(trierParNiveau(entrees).map((e) => e.key)).toEqual([
      'present',
      'imparfait',
      'futur',
      'passe-simple',
    ]);
  });
});
