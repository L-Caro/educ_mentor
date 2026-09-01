import { describe, expect, it } from 'vitest';
import {
  cleanWord,
  normalizeWordKey,
  tokenize,
} from 'src/modules/dictee/dictee.tokens.ts';

/**
 * L'écran de correction de la dictée découpe le contenu en jetons : chaque mot est
 * cliquable, la ponctuation et les espaces restent affichés mais inertes. La clé
 * normalisée d'un mot doit correspondre à celle calculée côté backend (`dictee.logic.ts`),
 * sinon un mot coché ici ne s'agrège pas au bon endroit dans le suivi de l'année.
 */

describe('dictee.tokens', () => {
  describe('normalizeWordKey', () => {
    it('met en minuscules et retire la ponctuation de bord', () => {
      expect(normalizeWordKey('Chat.')).toBe('chat');
      expect(normalizeWordKey('«Neige»')).toBe('neige');
      expect(normalizeWordKey("l'école")).toBe("l'école");
      expect(normalizeWordKey('l’ami')).toBe("l'ami");
    });
  });

  describe('cleanWord', () => {
    it('retire la ponctuation de bord en gardant la casse', () => {
      expect(cleanWord('Chat.')).toBe('Chat');
      expect(cleanWord('(rouge)')).toBe('rouge');
    });
  });

  describe('tokenize', () => {
    it('sépare mots, ponctuation accolée et espaces', () => {
      const tokens = tokenize('Le chat dort.');
      expect(tokens.map((token) => token.text)).toEqual([
        'Le',
        ' ',
        'chat',
        ' ',
        'dort.',
      ]);
      expect(tokens.filter((token) => token.isWord).map((token) => token.wordKey)).toEqual([
        'le',
        'chat',
        'dort',
      ]);
    });

    it('marque les espaces comme non cliquables', () => {
      const spaces = tokenize('a  b').filter((token) => !token.isWord);
      expect(spaces).toHaveLength(1);
      expect(spaces[0].text).toBe('  ');
    });

    it('donne un index stable à chaque jeton', () => {
      const tokens = tokenize('un deux trois');
      expect(tokens.map((token) => token.index)).toEqual([0, 1, 2, 3, 4]);
    });
  });
});
