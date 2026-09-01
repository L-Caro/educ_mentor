import {
  cleanWord,
  distinctWordKeys,
  extractWords,
  filterByNotion,
  normalizeWordKey,
  resolveItemCount,
} from './dictee.logic';

describe('dictee.logic', () => {
  describe('resolveItemCount', () => {
    it('sert des mots en débutant, des phrases en normal, un paragraphe en difficile', () => {
      expect(resolveItemCount('debutant', 'moyenne')).toBe(10);
      expect(resolveItemCount('normal', 'longue')).toBe(3);
      expect(resolveItemCount('difficile', 'courte')).toBe(1);
      expect(resolveItemCount('difficile', 'longue')).toBe(2);
    });
  });

  describe('normalizeWordKey', () => {
    it('retire la ponctuation de bord et met en minuscules', () => {
      expect(normalizeWordKey('Chat.')).toBe('chat');
      expect(normalizeWordKey('«oiseau»')).toBe('oiseau');
      expect(normalizeWordKey('(rouge)')).toBe('rouge');
      expect(normalizeWordKey('"neige".')).toBe('neige');
    });

    it("garde l'apostrophe et le trait d'union internes", () => {
      expect(normalizeWordKey("l'école")).toBe("l'école");
      expect(normalizeWordKey('arc-en-ciel')).toBe('arc-en-ciel');
    });

    it("normalise l'apostrophe typographique", () => {
      expect(normalizeWordKey('l’ami')).toBe("l'ami");
    });

    it('rend une clé vide pour un token purement ponctuation', () => {
      expect(normalizeWordKey('—')).toBe('');
      expect(normalizeWordKey('...')).toBe('');
    });
  });

  describe('extractWords', () => {
    it('découpe une phrase en mots et écarte la ponctuation isolée', () => {
      const words = extractWords('Le petit chat gris dort près du feu.');
      expect(words.map((word) => word.key)).toEqual([
        'le',
        'petit',
        'chat',
        'gris',
        'dort',
        'près',
        'du',
        'feu',
      ]);
    });

    it('conserve le mot brut et la forme affichée', () => {
      const words = extractWords('Où est-il ?');
      expect(words.map((word) => word.raw)).toEqual(['Où', 'est-il']);
      expect(words.map((word) => word.display)).toEqual(['Où', 'est-il']);
      expect(words.map((word) => word.key)).toEqual(['où', 'est-il']);
    });
  });

  describe('cleanWord', () => {
    it('retire la ponctuation de bord en gardant la casse', () => {
      expect(cleanWord('Chat.')).toBe('Chat');
      expect(cleanWord('«Neige»')).toBe('Neige');
    });
  });

  describe('distinctWordKeys', () => {
    it('déduplique les mots sur tout un lot de contenus', () => {
      const keys = distinctWordKeys(['Le chat dort.', 'Le chien court.']);
      expect(keys.sort()).toEqual(['chat', 'chien', 'court', 'dort', 'le']);
    });
  });

  describe('filterByNotion', () => {
    const items = [
      { notions: ['accents : é è ê'] },
      { notions: ['cédille', 'accents : é è ê'] },
      { notions: ['pluriel en -s'] },
    ];

    it('garde tout quand aucune notion demandée', () => {
      expect(filterByNotion(items, null)).toHaveLength(3);
      expect(filterByNotion(items, '')).toHaveLength(3);
    });

    it('ne garde que les items travaillant la notion', () => {
      expect(filterByNotion(items, 'accents : é è ê')).toHaveLength(2);
      expect(filterByNotion(items, 'cédille')).toHaveLength(1);
    });
  });
});
