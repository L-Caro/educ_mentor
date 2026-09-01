import {
  extractWords,
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

    it('conserve le mot brut pour l affichage, ponctuation de bord comprise', () => {
      const words = extractWords('Où est-il ?');
      expect(words.map((word) => word.raw)).toEqual(['Où', 'est-il']);
      expect(words.map((word) => word.key)).toEqual(['où', 'est-il']);
    });
  });
});
