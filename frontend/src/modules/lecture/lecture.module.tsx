import store from 'src/store';
import { lectureApi } from './lecture.api';
import type { ModuleManifest } from 'src/types/modules.types';
import type { SetupChoice } from 'src/types/game.types';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

async function loadTexts(): Promise<SetupChoice[]> {
  try {
    const texts = await store
      .dispatch(lectureApi.endpoints.getActiveTexts.initiate())
      .unwrap();

    return texts.map((t) => ({
      value:       String(t.id),
      label:       t.titre,
      icon:        t.play_count > 0 ? '✅' : '📖',
      description: t.play_count > 0
        ? `Meilleur score : ${t.best_correct}/${t.best_total}, joué ${t.play_count} fois`
        : `${t.question_count} question${t.question_count > 1 ? 's' : ''}`,
    }));
  } catch {
    return [];
  }
}

export const lectureModule: ModuleManifest = {
  id: 'lecture',
  category: 'francais',
  setupOptions: [
    {
      key: 'difficulty',
      type: 'single',
      label: 'Quel niveau ?',
      choices: [
        { value: 'easy',   icon: '🟢', label: 'Facile',    description: 'Texte visible + passage surligné : 2 choix' },
        { value: 'medium', icon: '🟡', label: 'Moyen',     description: 'Texte visible et scrollable : 4 choix' },
        { value: 'hard',   icon: '🔴', label: 'Difficile', description: 'Texte caché, de mémoire : 6 choix' },
      ],
    },
    {
      key:          'textId',
      type:         'single',
      label:        'Quel texte ?',
      loader:       loadTexts,
      emptyMessage: 'Aucun texte disponible. Créez-en dans Administration → Textes & Questions.',
    },
  ],
  loadGameSpec: () => import('./lecture.game.tsx').then((m) => m.lectureGameSpec),
  adminTabs: [{ to: '/admin/lecture', label: 'Textes & Questions', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./admin/LectureAdmin.tsx').then((m) => ({ Component: m.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint:   lectureApi.endpoints.getLectureProgression,
    resetEndpoint: lectureApi.endpoints.resetLectureProgression,
  }),
};