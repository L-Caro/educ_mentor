import type { AppModule } from './entities/module.entity';

/** Liste des modules disponibles dans l'application.
 * C'est ici qu'on ajoute un nouveau module — les données sont insérées en BDD au démarrage si elles n'existent pas encore. */
export const MODULES_CONFIG: Partial<AppModule>[] = [
  {
    id: 'imagier',
    name: 'Imagier Anglais',
    description: 'Apprendre le vocabulaire anglais avec des images',
    icon: '🇬🇧',
    is_active: false,
    display_order: 1,
  },
  {
    id: 'tables',
    name: 'Tables de multiplication',
    description: "Apprendre et s'entraîner sur les tables de multiplication",
    icon: '✖️',
    is_active: false,
    display_order: 2,
  },
  {
    id: 'calcul-mental',
    name: 'Calcul Mental',
    description: 'Opérations à trous — trouver le nombre manquant',
    icon: '🧮',
    is_active: false,
    display_order: 3,
  },
  {
    id: 'monnaie',
    name: 'Monnaie',
    description:
      'Reconnaître des pièces et billets, rendre la monnaie, calculer un total',
    icon: '💶',
    is_active: false,
    display_order: 4,
  },
  {
    id: 'heure',
    name: "Lire l'heure",
    description:
      "Lire l'heure sur une horloge à aiguilles, distinguer matin et après-midi",
    icon: '🕐',
    is_active: false,
    display_order: 5,
  },
  {
    id: 'conjugaison',
    name: 'Conjugaison',
    description:
      "Conjuguer les verbes aux temps du présent, de l'imparfait et du futur simple",
    icon: '✍️',
    is_active: false,
    display_order: 6,
  },
  {
    id: 'geo',
    name: 'Géographie',
    description: 'Capitales, drapeaux, continents, océans — explorer le monde',
    icon: '🌍',
    is_active: false,
    display_order: 7,
  },
  {
    id: 'france',
    name: 'France',
    description:
      'Départements, régions, préfectures, fleuves, massifs — la géographie française',
    icon: '🇫🇷',
    is_active: false,
    display_order: 8,
  },
  {
    id: 'snake',
    name: 'Snake',
    description:
      'Le jeu du serpent — grandir en mangeant des fruits, sans se mordre',
    icon: '🐍',
    is_active: false,
    display_order: 9,
  },
  {
    id: 'lecture',
    name: 'Lecture & Compréhension',
    description: 'Lire un texte et répondre à des questions de compréhension',
    icon: '📖',
    is_active: false,
    display_order: 10,
  },
  {
    id: 'numeration',
    name: 'Numération',
    description: 'Comparaison, suites, décomposition, valeur positionnelle',
    icon: '🔢',
    is_active: false,
    display_order: 11,
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Retrouver les paires de cartes identiques ou image + mot',
    icon: '🃏',
    is_active: false,
    display_order: 12,
  },
  {
    id: 'pose',
    name: 'Calcul posé',
    description:
      'Poser une addition ou une soustraction en colonnes, retenues comprises',
    icon: '🧾',
    is_active: false,
    display_order: 13,
  },
  {
    id: 'pendu',
    name: 'Le Pendu',
    description:
      'Deviner un mot lettre par lettre avant que le bonhomme soit pendu',
    icon: '🪢',
    is_active: false,
    display_order: 14,
  },
  {
    id: 'dictee',
    name: 'Dictée',
    description:
      "Écrire sous la dictée d'un adulte : mots, phrases ou paragraphes selon le niveau",
    icon: '📝',
    is_active: false,
    display_order: 15,
  },
  {
    id: 'geometrie',
    name: 'Géométrie',
    description:
      'Reconnaître les figures et les solides, compter côtés et sommets, repérer un angle droit',
    icon: '📐',
    is_active: false,
    display_order: 16,
  },
  {
    id: 'grammaire',
    name: 'Grammaire',
    description:
      'La nature des mots et leur fonction dans la phrase : nom, verbe, déterminant, sujet, groupe nominal',
    icon: '🔤',
    is_active: false,
    display_order: 17,
  },
  {
    id: 'accords',
    name: 'Les accords',
    description:
      'Genre et nombre des noms, accord de l’adjectif, du groupe nominal et du sujet avec le verbe',
    icon: '🔗',
    is_active: false,
    display_order: 18,
  },
  {
    id: 'morpion',
    name: 'Morpion',
    description:
      'Aligner trois signes avant l’adversaire, ou à deux sur le même écran',
    icon: '✕',
    is_active: false,
    display_order: 19,
  },
  {
    id: 'puissance4',
    name: 'Puissance 4',
    description:
      'Aligner quatre jetons — les pions tombent, la colonne décide',
    icon: '🔴',
    is_active: false,
    display_order: 20,
  },
];
