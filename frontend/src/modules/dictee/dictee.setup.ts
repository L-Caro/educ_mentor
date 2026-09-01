import store from 'src/store';
import type { SetupChoice, SetupOption } from 'src/types/game.types.ts';
import { dicteeApi } from './dictee.api';

/** Notions disponibles, tous niveaux confondus : le niveau n'est pas encore choisi
 * quand ce loader s'exécute. Un couple niveau + notion sans contenu est rattrapé au
 * démarrage de la partie (message d'erreur, retour au pré-jeu). */
async function loadNotions(): Promise<SetupChoice[]> {
  const toutes: SetupChoice = { value: 'toutes', label: 'Toutes les notions' };
  try {
    const notions = await store
      .dispatch(dicteeApi.endpoints.getDicteeNotions.initiate(undefined))
      .unwrap();
    return [toutes, ...notions.map((notion) => ({ value: notion, label: notion }))];
  } catch {
    return [toutes];
  }
}

export const DICTEE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'niveau',
    type: 'single',
    label: 'Quel niveau ?',
    choices: [
      { value: 'debutant', icon: '🟢', label: 'Débutant', description: 'Des mots' },
      { value: 'normal', icon: '🟡', label: 'Normal', description: 'Des phrases' },
      { value: 'difficile', icon: '🔴', label: 'Difficile', description: 'Un paragraphe' },
    ],
  },
  {
    key: 'longueur',
    type: 'single',
    label: 'Longueur de la dictée',
    choices: [
      { value: 'courte', label: 'Courte', description: '5 mots · 1 phrase · 1 paragraphe' },
      { value: 'moyenne', label: 'Moyenne', description: '10 mots · 2 phrases · 1 paragraphe' },
      { value: 'longue', label: 'Longue', description: '15 mots · 3 phrases · 2 paragraphes' },
    ],
  },
  {
    key: 'notion',
    type: 'single',
    label: 'Notion à travailler',
    loader: loadNotions,
    emptyMessage: 'Aucun contenu disponible. Importez une dictée dans Administration.',
  },
  {
    key: 'preparee',
    type: 'single',
    label: 'Dictée préparée ?',
    choices: [
      { value: 'non', label: 'Non', description: 'On dicte directement' },
      { value: 'oui', label: 'Oui', description: 'Le texte est affiché une minute avant' },
    ],
  },
];
