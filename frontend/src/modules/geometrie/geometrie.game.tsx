import store from 'src/store';
import { geometrieApi } from './geometrie.api';
import GeometriePrompt from './GeometriePrompt';
import { geometrieFiche } from './geometrie.fiche';
import type { GeometrieQuestion, GeometrieSessionResponse } from './geometrie.type';
import type { GameModuleSpec } from 'src/types/game.types';
import './geometrie.scss';

/** Minuscules, sans accents : un enfant qui tape « decagone » ou « heptagone » sans les
 * accents ne doit pas être sanctionné pour ça : ce module évalue la géométrie, pas l'orthographe. */
function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export const geometrieGameSpec: GameModuleSpec<GeometrieSessionResponse, GeometrieQuestion> = {

  loadSession: async (setup) => {
    const questionTypes = (setup.questionTypes as string[] | undefined) ?? [];
    return store.dispatch(geometrieApi.endpoints.startGeometrieSession.initiate({
      difficulty: setup.difficulty as string | undefined,
      question_types: questionTypes,
    })).unwrap();
  },

  getQuestions: (session) => session.questions,

  renderPrompt: (question) => <GeometriePrompt key={question.item_key} question={question} />,

  qcm: {
    getChoices: (question) => question.choices.map((choice) => ({ key: choice, label: choice })),
    correctKey: (question) => question.answer,
    layout: 'list',
  },

  free: {
    parse: (raw) => raw.trim(),
    isCorrect: (question, given) => {
      if (typeof given !== 'string' || !given) return false;
      // Les côtés/sommets/faces/arêtes sont un nombre exact : pas de tolérance à normaliser.
      if (question.type === 'cotes_sommets') return given.trim() === question.answer;
      return normalizeText(given) === normalizeText(question.answer);
    },
    inputProps: (question) =>
      question.type === 'cotes_sommets'
        ? { variant: 'number' as const, numeric: true }
        : { variant: 'text' as const, maxLength: 40 },
  },

  correctionLabel: (question) => question.answer,

  fiche: geometrieFiche,

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(geometrieApi.endpoints.recordGeometrieAnswer.initiate({
      sessionId, skillKey: question.skill_key, isCorrect: correct,
    })).unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(geometrieApi.endpoints.completeGeometrieSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),

  buildResultEntry: (question, given, correct, timeout) => ({
    label: question.display,
    given: typeof given === 'string' && given ? given : null,
    expected: question.answer,
    correct,
    timeout,
  }),

  showQuestionTag: true,
};
