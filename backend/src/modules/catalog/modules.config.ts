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
    description: 'Reconnaître des pièces et billets, rendre la monnaie, calculer un total',
    icon: '💶',
    is_active: false,
    display_order: 4,
  },
  {
    id: 'heure',
    name: 'Lire l\'heure',
    description: 'Lire l\'heure sur une horloge à aiguilles, distinguer matin et après-midi',
    icon: '🕐',
    is_active: false,
    display_order: 5,
  },
  {
    id: 'conjugaison',
    name: 'Conjugaison',
    description: 'Conjuguer les verbes aux temps du présent, de l\'imparfait et du futur simple',
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
];
