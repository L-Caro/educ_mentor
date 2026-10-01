import type { ModuleManifest } from 'src/types/modules.types';
import SolfegeGame from './SolfegeGame';
import { solfegeImpression } from './solfege.impression';

/**
 * Le solfège, calé sur sa méthode.
 *
 * `skipDifficulty` : facile/normal/difficile ne veut rien dire. Ce qui fait la difficulté,
 * c'est la CLÉ, l'étendue des notes et les figures au programme, et ces trois-là avancent
 * à des rythmes différents. Son cahier le montre : la clé de fa arrive à la leçon 3, alors
 * que les croches ne sont toujours pas là.
 *
 * Les réglages sont donc ceux de son cours, et se cochent au fur et à mesure qu'elle les
 * voit. Rien n'est verrouillé par année : la progression d'une méthode ne suit pas le
 * calendrier.
 *
 * Et ils vivent dans l'ADMINISTRATION, pas ici : l'intervalle de notes, les notes
 * ouvertes, le mouvement, les figures, la mesure et la longueur des phrases disent où elle
 * en est en cours, et cela ne se décide pas avant chaque partie. Le pré-jeu garde ce qui
 * relève de la séance : ce qu'elle travaille aujourd'hui, dans quelle clé, et à quelle
 * vitesse bat le métronome.
 */
export const solfegeModule: ModuleManifest = {
  id: 'solfege',
  category: 'musique',
  skipDifficulty: true,
  setupOptions: [
    {
      key: 'types',
      type: 'multi',
      label: 'Ce qu’on travaille',
      choices: [
        { value: 'lire', label: 'Lire une note' },
        {
          value: 'partition',
          label: 'Lire une partition',
          description: 'Trois à cinq notes d’un coup, comme en lecture groupée',
        },
        { value: 'placer', label: 'Placer une note sur la portée' },
        { value: 'figure', label: 'Nommer une figure ou un silence' },
        { value: 'mesure', label: 'Compléter une mesure' },
        { value: 'rythme', label: 'Frapper un rythme' },
        { value: 'dictee', label: 'Dictée rythmique' },
        { value: 'oreille', label: 'Ça monte ou ça descend ?' },
      ],
    },
    {
      key: 'cles',
      type: 'single',
      label: 'Quelle clé',
      choices: [
        { value: 'sol', label: 'Clé de sol' },
        { value: 'fa', label: 'Clé de fa' },
        {
          value: 'les-deux',
          label: 'Les deux mélangées',
          description: 'Le même dessin change de nom : c’est le vrai saut',
        },
      ],
    },
    {
      key: 'tempo',
      type: 'single',
      label: 'Vitesse du métronome',
      choices: [
        { value: '60', label: 'Très lente' },
        { value: '72', label: 'Lente' },
        { value: '90', label: 'Moyenne' },
        { value: '110', label: 'Rapide' },
      ],
    },
    {
      key: 'syllabes',
      type: 'single',
      label: 'Écrire Taé et Aé sous les notes',
      choices: [
        { value: 'oui', label: 'Oui', description: 'Comme dans son cahier' },
        {
          value: 'non',
          label: 'Non',
          description: 'Les lire, c’est déjà ne plus lire le rythme',
        },
      ],
    },
  ],
  child: { Game: SolfegeGame },
  adminTabs: [{ to: '/admin/solfege', label: 'Paramètres', end: true }],
  adminRoutes: [
    {
      index: true,
      lazy: () =>
        import('./SolfegeSettings.tsx').then((m) => ({ Component: m.default })),
    },
  ],
  impression: solfegeImpression,
};
