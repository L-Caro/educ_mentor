export interface CategoryConfig {
  key: string;
  label: string;
  icon: string;
}

const CATEGORY_REGISTRY: CategoryConfig[] = [
  { key: 'animaux', icon: '🐘', label: 'Animaux' },
  { key: 'nourriture', icon: '🍎', label: 'Nourriture' },
  { key: 'couleurs', icon: '🎨', label: 'Couleurs' },
  { key: 'vetements', icon: '👕', label: 'Vêtements' },
  { key: 'verbes', icon: '🏃', label: 'Verbes' },
  { key: 'corps-humain', icon: '🫀', label: 'Corps humain' },
  { key: 'emotions', icon: '😊', label: 'Émotions' },
  { key: 'jours-semaine', icon: '📅', label: 'Jours' },
  { key: 'meubles', icon: '🪑', label: 'Meubles' },
  { key: 'outils', icon: '🔧', label: 'Outils' },
  { key: 'appareils-menagers', icon: '🍳', label: 'Appareils ménagers' },
  { key: 'appareil-menager', icon: '🍳', label: 'Appareils ménagers' },
  { key: 'arbres-et-fleurs', icon: '🌸', label: 'Arbres et fleurs' },
  { key: 'plantes-et-nature', icon: '🌿', label: 'Plantes & Nature' },
  { key: 'sante', icon: '🩺', label: 'Santé' },
  { key: 'appareils-informatiques', icon: '💻', label: 'Appareils informatiques' },
  { key: 'appareil-informatique', icon: '💻', label: 'Appareils informatiques' },
  { key: 'ecosystemes', icon: '🌍', label: 'Écosystèmes' },
  { key: 'temps', icon: '⛅', label: 'Météo & Temps' },
  { key: 'autres', icon: '📦', label: 'Autres' },
];

const CATEGORY_MAP = new Map<string, CategoryConfig>(
  CATEGORY_REGISTRY.map((category) => [category.key, category])
);

export function getCategoryConfig(key: string): CategoryConfig {
  // Normalise l'entrée : casse + underscores → tirets pour absorber les données
  // non encore nettoyées en BDD (ex: "Plantes_et_nature" avant la migration).
  const normalized = key.trim().toLowerCase().replace(/_/g, '-');
  const found = CATEGORY_MAP.get(normalized);
  if (found) return found;

  const label = key.replace(/[_-]/g, ' ').replace(/^\w/, (char) => char.toUpperCase());
  return { key, icon: '📚', label };
}

export { CATEGORY_REGISTRY };
