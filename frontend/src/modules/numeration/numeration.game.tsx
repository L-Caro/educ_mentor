import store from 'src/store';
import { numerationApi } from './numeration.api';
import type { NumerationQuestion, NumerationSessionResponse, PositionKey } from './numeration.type';
import type { GameModuleSpec } from 'src/types/game.types';
import { formatNumbers } from 'src/utils/formatNumber';
import './numeration.scss';

// ─── Constantes ───────────────────────────────────────────────────────────────

const POSITION_NAME: Record<PositionKey, string> = {
  u: 'unités', d: 'dizaines', c: 'centaines',
  m: 'milliers', dm: 'dizaines de milliers', cm: 'centaines de milliers',
};

// ─── Prompt ───────────────────────────────────────────────────────────────────

function NumerationPrompt({ question }: { question: NumerationQuestion }) {
  if (question.type === 'comparaison') {
    const [left, , right] = question.display.split('  ');
    return (
      <div className="NumerationPrompt NumerationPrompt--comparaison">
        <span className="NumerationPrompt__number">{formatNumbers(left)}</span>
        <span className="NumerationPrompt__blank">□</span>
        <span className="NumerationPrompt__number">{formatNumbers(right)}</span>
      </div>
    );
  }

  if (question.type === 'suite') {
    const terms = question.suite_terms ?? [];
    return (
      <div className="NumerationPrompt NumerationPrompt--suite">
        {terms.map((t, i) => (
          <span key={i} className="NumerationPrompt__term">{formatNumbers(t)}</span>
        ))}
        <span className="NumerationPrompt__term NumerationPrompt__term--blank">?</span>
      </div>
    );
  }

  if (question.type === 'decomposition') {
    return (
      <div className="NumerationPrompt NumerationPrompt--decomposition">
        <p className="NumerationPrompt__label">Décompose</p>
        <span className="NumerationPrompt__bigNumber">{formatNumbers(question.display)}</span>
      </div>
    );
  }

  // valeur_positionnelle
  return (
    <div className="NumerationPrompt NumerationPrompt--valpos">
      <p className="NumerationPrompt__question">{formatNumbers(question.display)}</p>
    </div>
  );
}

// ─── Correction label ─────────────────────────────────────────────────────────

function correctionForDecompose(question: NumerationQuestion): string {
  const positions = question.decompose_positions ?? [];
  const digits    = question.answer.split(':');
  return positions
    .map((pos, i) => `${digits[i] || '?'} ${POSITION_NAME[pos]}`)
    .join(', ');
}

// ─── Spec ─────────────────────────────────────────────────────────────────────

export const numerationGameSpec: GameModuleSpec<NumerationSessionResponse, NumerationQuestion> = {

  loadSession: async (setup) => {
    const questionTypes = (setup.questionTypes as string[] | undefined) ?? [];
    return store.dispatch(numerationApi.endpoints.startNumerationSession.initiate({ questionTypes })).unwrap();
  },

  getQuestions: (session) => session.questions,

  renderPrompt: (question) => <NumerationPrompt key={question.item_key} question={question} />,

  qcm: {
    getChoices: (q) => q.choices.map((c) => ({ key: c, label: formatNumbers(c) })),
    correctKey: (q) => q.answer,
    layout: 'list',
  },

  free: {
    parse:     (raw) => raw.trim(),
    isCorrect: (q, given) => String(given) === q.answer,
    inputProps: (q) => q.type === 'decomposition'
      ? { variant: 'decompose' as const, decomposePositions: q.decompose_positions ?? [], decomposeLabels: POSITION_NAME }
      : { variant: 'number'   as const, numeric: true },
    isReady: (q, input) => {
      if (q.type !== 'decomposition') return input.trim() !== '';
      const parts = input.split(':');
      const needed = (q.decompose_positions ?? []).length;
      return parts.length === needed && parts.every((p) => p !== '' && /^\d$/.test(p));
    },
  },

  correctionLabel: (q) =>
    q.type === 'decomposition' ? correctionForDecompose(q) : formatNumbers(q.answer),

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(numerationApi.endpoints.recordNumerationAnswer.initiate({
      sessionId, itemKey: question.item_key, isCorrect: correct,
    })).unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(numerationApi.endpoints.completeNumerationSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),

  buildResultEntry: (question, given, correct, timeout) => {
    const expected = question.type === 'decomposition'
      ? correctionForDecompose(question)
      : formatNumbers(question.answer);

    let givenLabel: string | null = null;
    if (typeof given === 'string' && given !== '' && question.type === 'decomposition') {
      const positions = question.decompose_positions ?? [];
      const digits    = given.split(':');
      givenLabel = positions.map((pos, i) => `${digits[i] || '?'} ${POSITION_NAME[pos]}`).join(', ');
    } else if (typeof given === 'string' && given !== '') {
      givenLabel = formatNumbers(given);
    }

    return {
      label:    formatNumbers(question.display),
      given:    givenLabel,
      expected,
      correct,
      timeout,
    };
  },

  showQuestionTag: true,
};