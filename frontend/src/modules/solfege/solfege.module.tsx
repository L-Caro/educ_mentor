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
      key: 'etendue',
      type: 'single',
      label: 'Jusqu’où vont les notes',
      choices: [
        { value: '0', label: 'Dans la portée' },
        { value: '1', label: '+ 1 ligne supplémentaire' },
        { value: '2', label: '+ 2 lignes supplémentaires' },
      ],
    },
    {
      key: 'figures',
      type: 'multi',
      label: 'Quelles figures',
      choices: [
        { value: 'ronde', label: 'Ronde et pause' },
        { value: 'blanche', label: 'Blanche et demi-pause' },
        { value: 'noire', label: 'Noire et soupir' },
        { value: 'croche', label: 'Croche et demi-soupir' },
        { value: 'doubleCroche', label: 'Double croche' },
      ],
    },
    {
      key: 'mesure',
      type: 'single',
      label: 'Combien de temps par mesure',
      choices: [
        { value: '2', label: '2 temps' },
        { value: '3', label: '3 temps' },
        { value: '4', label: '4 temps' },
      ],
    },
    {
      key: 'longueur',
      type: 'single',
      label: 'Longueur des phrases à frapper',
      choices: [
        { value: '4', label: 'Très courte', description: 'Pour découvrir' },
        { value: '8', label: 'Courte' },
        { value: '12', label: 'Moyenne' },
        { value: '16', label: 'Longue', description: 'Une quinzaine de notes' },
      ],
    },
    {
      key: 'tempo',
      type: 'single',
      label: 'Vitesse du métronome',
      choices: [
        { value: '60', label: 'Très lent' },
        { value: '72', label: 'Lent' },
        { value: '90', label: 'Moyen' },
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
  adminTabs: [],
  adminRoutes: [],
  impression: solfegeImpression,
};
