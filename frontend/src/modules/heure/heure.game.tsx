import store from 'src/store';
import { heureApi } from './heure.api.ts';
import { sharedApi } from 'src/store/api/sharedApi.ts';
import ClockFace from './components/ClockFace.tsx';
import type { HeureQuestion, HeureSessionResponse } from './heure.type.ts';
import type { GameModuleSpec } from 'src/types/game.types.ts';
import './heure.scss';

// Variable module-level mise à jour par loadSession avant que le moteur ne lise inputProps.
// Garantit que le getter ci-dessous retourne toujours la valeur courante de la session.
let _sep: ':' | 'h' = ':';

function formatTime(totalMinutes: number, sep: ':' | 'h' = _sep): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins  = totalMinutes % 60;
  return sep === 'h'
    ? `${hours}h${String(mins).padStart(2, '0')}`
    : `${hours}:${String(mins).padStart(2, '0')}`;
}

function extractMinutes(given: unknown): number {
  if (given == null) return -1;
  const val = Number(given);
  return isNaN(val) ? -1 : val;
}

export const heureGameSpec: GameModuleSpec<HeureSessionResponse, HeureQuestion> = {

  loadSession: async (setup) => {
    const settings = await store.dispatch(sharedApi.endpoints.getSettings.initiate()).unwrap();
    _sep = settings.heure_separator === 'h' ? 'h' : ':';
    const session = await store.dispatch(heureApi.endpoints.startHeureSession.initiate({
      difficulty:  setup.difficulty  as string | undefined,
      numeralType: setup.numeralType as string | undefined,
    })).unwrap();
    return { ...session, separator: _sep };
  },

  // Injecte le séparateur dans chaque question (pour getChoices / correctionLabel)
  getQuestions: (session) =>
    session.questions.map((q) => ({ ...q, separator: session.separator ?? _sep })),

  renderPrompt: (question) => (
    <ClockFace
      hour={question.hour}
      minute={question.minute}
      numeralType={question.numeral_type}
    />
  ),

  qcm: {
    getChoices: (question) =>
      question.choices.map((choice) => ({
        key: String(choice),
        label: formatTime(choice, question.separator ?? _sep),
      })),
    correctKey: (question) => String(question.answer_value),
  },

  free: {
    parse: (raw) => {
      const [hStr = '', mStr = ''] = raw.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return -1;
      return h * 60 + m;
    },
    isCorrect: (question, given) =>
      typeof given === 'number' && given >= 0 && given === question.answer_value,
    // Getter : évalué à chaque accès → retourne toujours _sep à jour
    get inputProps() {
      return { variant: 'time' as const, timeSeparator: _sep };
    },
  },

  correctionLabel: (question) => formatTime(question.answer_value, question.separator ?? _sep),

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(heureApi.endpoints.recordHeureAnswer.initiate({
      sessionId,
      answerValue: question.answer_value,
      isCorrect: correct,
    })).unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(heureApi.endpoints.completeHeureSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),

  buildResultEntry: (question, given, correct, timeout) => {
    const val = extractMinutes(given);
    const sep = question.separator ?? _sep;
    return {
      label: formatTime(question.answer_value, sep),
      given: val >= 0 ? formatTime(val, sep) : null,
      expected: formatTime(question.answer_value, sep),
      correct,
      timeout,
    };
  },

  showQuestionTag: true,
};
