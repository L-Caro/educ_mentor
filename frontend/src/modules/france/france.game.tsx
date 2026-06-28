import store from 'src/store';
import { franceApi } from './france.api.ts';
import type { FranceQuestion, FranceSessionResponse } from './france.type.ts';
import type { GameModuleSpec } from 'src/types/game.types.ts';
import './france.scss';

const NUMBER_TYPES = new Set(['dept_to_number', 'number_to_dept']);

export const franceGameSpec: GameModuleSpec<FranceSessionResponse, FranceQuestion> = {

  loadSession: async (setup) => {
    return store.dispatch(franceApi.endpoints.startFranceSession.initiate({
      difficulty:    setup.difficulty    as string | undefined,
      questionTypes: setup.questionTypes as string[] | undefined,
    })).unwrap();
  },

  getQuestions: (session) => session.questions,

  renderPrompt: (question) => {
    const isNumber = NUMBER_TYPES.has(question.type);
    return (
      <div className="FrancePrompt">
        <p className={`FrancePrompt__display${isNumber ? ' FrancePrompt__display--number' : ''}`}>
          {question.display}
        </p>
        <p className="FrancePrompt__label">{question.prompt}</p>
      </div>
    );
  },

  qcm: {
    getChoices: (q) => q.choices.map((c) => ({ key: c, label: c })),
    correctKey:  (q) => q.answer  ?? '',
    correctKeys: (q) => q.answers ?? [],
    layout: 'list',
  },

  free: {
    parse: (raw) => raw.trim(),
    isCorrect: (q, given) => {
      if (typeof given !== 'string' || !given) return false;
      const normalize = (s: string) =>
        s.trim().toLowerCase()
         .normalize('NFD').replace(/[̀-ͯ]/g, '')
         .replace(/[-']/g, ' ')
         .replace(/\s+/g, ' ');
      return normalize(given) === normalize(q.answer ?? '');
    },
    inputProps: { variant: 'text', placeholder: '…', maxLength: 60 },
  },

  correctionLabel: (question) => {
    if (question.answers !== null) return question.answers.join(', ');
    return question.answer ?? '';
  },

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(franceApi.endpoints.recordFranceAnswer.initiate({
      sessionId,
      itemKey: question.item_key,
      isCorrect: correct,
    })).unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(franceApi.endpoints.completeFranceSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),

  buildResultEntry: (question, given, correct, timeout) => {
    const isMulti = question.answers !== null;
    if (isMulti) {
      const givenArr = Array.isArray(given) ? (given as string[]) : [];
      return {
        label:    question.prompt,
        given:    givenArr.length > 0 ? givenArr.join(', ') : null,
        expected: (question.answers ?? []).join(', '),
        correct,
        timeout,
      };
    }
    return {
      label:    question.prompt,
      given:    typeof given === 'string' ? given : null,
      expected: question.answer ?? '',
      correct,
      timeout,
    };
  },

  showQuestionTag: true,
};
