export interface CategoryConfig {
  key: string;
  label: string;
  icon: string;
}

/** Les 18 catégories du catalogue imagier (thèmes kids-flashcards). La clé correspond
 * à la colonne `category` en base ; `poc/category-map.json` fait foi côté import. */
const CATEGORY_REGISTRY: CategoryConfig[] = [
  { key: 'animaux', icon: '🐘', label: 'Animaux' },
  { key: 'oiseaux', icon: '🦜', label: 'Oiseaux' },
  { key: 'nourriture', icon: '🍎', label: 'Nourriture' },
  { key: 'bebe', icon: '👶', label: 'Bébé' },
  { key: 'personnes', icon: '🧑', label: 'Personnes' },
  { key: 'couleurs-et-formes', icon: '🎨', label: 'Couleurs et formes' },
  { key: 'transports', icon: '🚗', label: 'Transports' },
  { key: 'maison', icon: '🏠', label: 'Maison' },
  { key: 'cuisine', icon: '🍳', label: 'Cuisine' },
  { key: 'chambre', icon: '🛏️', label: 'Chambre' },
  { key: 'mathematiques', icon: '🔢', label: 'Mathématiques' },
  { key: 'fetes', icon: '🎉', label: 'Fêtes' },
  { key: 'verbes', icon: '🏃', label: 'Verbes' },
  { key: 'adjectifs', icon: '📏', label: 'Adjectifs' },
  { key: 'nature', icon: '🌿', label: 'Nature' },
  { key: 'calendrier', icon: '📅', label: 'Calendrier' },
  { key: 'electromenager', icon: '🧺', label: 'Électroménager' },
  { key: 'ecole', icon: '🎒', label: 'École' },
  { key: 'autres', icon: '📦', label: 'Autres' },
];

const CATEGORY_MAP = new Map<string, CategoryConfig>(
  CATEGORY_REGISTRY.map((category) => [category.key, category])
);

export function getCategoryConfig(key: string): CategoryConfig {
  // Normalise l'entrée : casse + underscores → tirets pour absorber une donnée non nettoyée.
  const normalized = key.trim().toLowerCase().replace(/_/g, '-');
  const found = CATEGORY_MAP.get(normalized);
  if (found) return found;

  const label = key.replace(/[_-]/g, ' ').replace(/^\w/, (char) => char.toUpperCase());
  return { key, icon: '📚', label };
}

/** Libellés des sous-catégories (menu « Précise » du pré-jeu). Clé = colonne `subcategory`
 * en base ; source : `poc/category-map.json`. Une clé absente retombe sur un prettify basique. */
const SUBCATEGORY_LABELS: Record<string, string> = {
  'animaux-domestiques': 'Animaux domestiques',
  'animaux-de-la-ferme': 'Animaux de la ferme',
  'animaux-marins': 'Animaux marins',
  insectes: 'Insectes',
  'animaux-de-la-jungle': 'Animaux de la jungle',
  'animaux-de-la-foret': 'Animaux de la forêt',
  'animaux-de-l-arctique': "Animaux de l'Arctique",
  'oiseaux-de-la-ferme': 'Oiseaux de la ferme',
  'oiseaux-sauvages': 'Oiseaux sauvages',
  fruits: 'Fruits',
  legumes: 'Légumes',
  baies: 'Baies',
  'objets-de-bebe': 'Objets de bébé',
  'vetements-de-bebe': 'Vêtements de bébé',
  'aire-de-jeux': 'Aire de jeux',
  'parties-du-corps': 'Parties du corps',
  visage: 'Visage',
  'ages-de-la-vie': 'Âges de la vie',
  'membres-de-la-famille': 'Membres de la famille',
  professions: 'Professions',
  metiers: 'Métiers',
  couleurs: 'Couleurs',
  'formes-2d': 'Formes 2D',
  'formes-3d': 'Formes 3D',
  'transport-terrestre': 'Transport terrestre',
  aeronefs: 'Aéronefs',
  'transport-ferroviaire': 'Transport ferroviaire',
  'transport-maritime': 'Transport maritime',
  velos: 'Vélos',
  motos: 'Motos',
  meubles: 'Meubles',
  'la-maison': 'La maison',
  jardin: 'Jardin',
  pieces: 'Pièces',
  'vaisselle-et-couverts': 'Vaisselle et couverts',
  'ustensiles-de-cuisine': 'Ustensiles de cuisine',
  lit: 'Lit',
  'accessoires-de-chambre': 'Accessoires de chambre',
  'nombres-1-20': 'Nombres (1-20)',
  compter: 'Compter',
  noel: 'Noël',
  halloween: 'Halloween',
  'saint-valentin': 'Saint-Valentin',
  'fete-des-meres': 'Fête des mères',
  paques: 'Pâques',
  'verbes-d-action': "Verbes d'action",
  'verbes-de-mouvement': 'Verbes de mouvement',
  'verbes-du-quotidien': 'Verbes du quotidien',
  'verbes-d-etat': "Verbes d'état",
  contraires: 'Contraires',
  'systeme-solaire': 'Système solaire',
  meteo: 'Météo',
  'etendues-d-eau': "Étendues d'eau",
  'mois-de-l-annee': "Mois de l'année",
  'jours-de-la-semaine': 'Jours de la semaine',
  electronique: 'Électronique',
  gadgets: 'Gadgets',
  'objets-de-la-classe': 'Objets de la classe',
  'batiment-scolaire': 'Bâtiment scolaire',
};

export function getSubcategoryLabel(slug: string): string {
  return (
    SUBCATEGORY_LABELS[slug] ??
    slug.replace(/-/g, ' ').replace(/^\w/, (char) => char.toUpperCase())
  );
}

export { CATEGORY_REGISTRY };
