import { describe, expect, it } from 'vitest';
import {
  CATEGORY_REGISTRY,
  getCategoryConfig,
  getSubcategoryLabel,
} from 'src/modules/imagier/constants/categories.ts';

/**
 * Le pré-jeu imagier affiche une tuile par catégorie, avec le label et l'emoji résolus par
 * `getCategoryConfig`. Une catégorie du catalogue absente du registre retombe sur le
 * fallback 📚 + label anglais brut : visible et moche. Ce test fige la correspondance entre
 * les 18 thèmes importés (cf. `poc/category-map.json`) et le registre.
 */

const CATALOG_CATEGORIES = [
  'animaux', 'oiseaux', 'nourriture', 'bebe', 'personnes', 'couleurs-et-formes',
  'transports', 'maison', 'cuisine', 'chambre', 'mathematiques', 'fetes',
  'verbes', 'adjectifs', 'nature', 'calendrier', 'electromenager', 'ecole',
];

describe('registre des catégories imagier', () => {
  it('résout les 18 catégories du catalogue sans tomber sur le fallback', () => {
    for (const key of CATALOG_CATEGORIES) {
      const config = getCategoryConfig(key);
      expect(config.key, key).toBe(key);
      expect(config.icon, `${key} sans emoji dédié`).not.toBe('📚');
      expect(config.label.length, `${key} sans label`).toBeGreaterThan(0);
    }
  });

  it('ne contient pas de clé en double', () => {
    const keys = CATEGORY_REGISTRY.map((category) => category.key);
    expect(keys).toHaveLength(new Set(keys).size);
  });

  it('rend un fallback lisible pour une catégorie inconnue', () => {
    const config = getCategoryConfig('unknown_theme');
    expect(config.icon).toBe('📚');
    expect(config.label).toBe('Unknown theme');
  });

  it('donne un libellé FR correct aux sous-catégories (accents, apostrophes)', () => {
    expect(getSubcategoryLabel('animaux-de-l-arctique')).toBe("Animaux de l'Arctique");
    expect(getSubcategoryLabel('animaux-de-la-foret')).toBe('Animaux de la forêt');
    expect(getSubcategoryLabel('verbes-d-action')).toBe("Verbes d'action");
    // clé inconnue → prettify basique, pas de crash
    expect(getSubcategoryLabel('truc-machin')).toBe('Truc machin');
  });
});
