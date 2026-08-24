import store from 'src/store';
import { heureApi } from './heure.api.ts';
import { sharedApi } from 'src/store/api/sharedApi.ts';
import ClockFace from './components/ClockFace.tsx';
import type { HeureQuestion, HeureSessionResponse, NumeralType } from './heure.type.ts';
import type { GameModuleSpec } from 'src/types/game.types.ts';
import { heureFiche } from './heure.fiche.ts';
import './heure.scss';

let _sep:  ':' | 'h'              = ':';
let _mode: 'digital' | 'expression' = 'digital';

// ─── Expressions françaises ───────────────────────────────────────────────────

const FR_HOURS = [
  'Minuit', 'Une heure', 'Deux heures', 'Trois heures', 'Quatre heures',
  'Cinq heures', 'Six heures', 'Sept heures', 'Huit heures', 'Neuf heures',
  'Dix heures', 'Onze heures', 'Midi',
];

function hourLabel(h24: number): string {
  const h = h24 % 24;
  if (h === 0)  return 'minuit';
  if (h === 12) return 'midi';
  return FR_HOURS[h % 12];
}

function toFrenchExpression(hour: number, minute: number): string {
  const nextH = (hour + 1) % 24;
  switch (minute) {
    case 0:  return `${hourLabel(hour)} pile`;
    case 15: return `${hourLabel(hour)} et quart`;
    case 30: return `${hourLabel(hour)} et demie`;
    case 40: return `${hourLabel(nextH)} moins vingt`;
    case 45: return `${hourLabel(nextH)} moins le quart`;
    case 50: return `${hourLabel(nextH)} moins dix`;
    case 55: return `${hourLabel(nextH)} moins cinq`;
    default: return formatTime(hour * 60 + minute);
  }
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

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

function miniClock(answerValue: number, numeralType: NumeralType) {
  const h = Math.floor(answerValue / 60);
  const m = answerValue % 60;
  return <ClockFace hour={h} minute={m} numeralType={numeralType} mini />;
}

// ─── Spec ─────────────────────────────────────────────────────────────────────

export const heureGameSpec: GameModuleSpec<HeureSessionResponse, HeureQuestion> = {

  loadSession: async (setup) => {
    const settings = await store.dispatch(sharedApi.endpoints.getSettings.initiate()).unwrap();
    _sep  = settings.heure_separator === 'h' ? 'h' : ':';
    _mode = setup.questionMode === 'expression' ? 'expression' : 'digital';

    const session = await store.dispatch(heureApi.endpoints.startHeureSession.initiate({
      difficulty:    setup.difficulty    as string | undefined,
      numeralType:   setup.numeralType   as string | undefined,
      questionMode:  setup.questionMode  as string | undefined,
    })).unwrap();
    return { ...session, separator: _sep, questionMode: _mode };
  },

  getQuestions: (session) =>
    session.questions.map((q) => ({
      ...q,
      separator: session.separator ?? _sep,
      questionMode: session.questionMode ?? _mode,
    })),

  renderPrompt: (question) => {
    if (_mode === 'expression') {
      return (
        <div className="HeureExpression">
          <p className="HeureExpression__expr">{toFrenchExpression(question.hour, question.minute)}</p>
        </div>
      );
    }
    return (
      <ClockFace
        hour={question.hour}
        minute={question.minute}
        numeralType={question.numeral_type}
      />
    );
  },

  qcm: {
    getChoices: (question) => {
      if (_mode === 'expression') {
        return question.choices.map((choice) => ({
          key:   String(choice),
          label: miniClock(choice, question.numeral_type),
        }));
      }
      return question.choices.map((choice) => ({
        key:   String(choice),
        label: formatTime(choice, question.separator ?? _sep),
      }));
    },
    correctKey: (question) => String(question.answer_value),
    get layout() { return _mode === 'expression' ? 'grid' as const : 'list' as const; },
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
    get inputProps() { return { variant: 'time' as const, timeSeparator: _sep }; },
  },

  correctionLabel: (question) => {
    if (_mode === 'expression') return toFrenchExpression(question.hour, question.minute);
    return formatTime(question.answer_value, question.separator ?? _sep);
  },

  fiche: heureFiche,

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
    if (_mode === 'expression') {
      const correctExpr = toFrenchExpression(question.hour, question.minute);
      const givenValue  = extractMinutes(given);
      const givenExpr   = givenValue >= 0
        ? toFrenchExpression(Math.floor(givenValue / 60), givenValue % 60)
        : null;
      return { label: correctExpr, given: givenExpr, expected: correctExpr, correct, timeout };
    }
    const val = extractMinutes(given);
    const sep = question.separator ?? _sep;
    return {
      label:    formatTime(question.answer_value, sep),
      given:    val >= 0 ? formatTime(val, sep) : null,
      expected: formatTime(question.answer_value, sep),
      correct,
      timeout,
    };
  },

  showQuestionTag: true,
};
