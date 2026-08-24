import store from 'src/store';
import { lectureApi } from './lecture.api';
import { LecturePromptView } from './LecturePromptView';
import { lectureFiche } from './lecture.fiche';
import type { LectureQuestion, LectureSessionResponse } from './lecture.type';
import type { GameModuleSpec } from 'src/types/game.types';
import './lecture.scss';

// ─── Spec du module ───────────────────────────────────────────────────────────

export const lectureGameSpec: GameModuleSpec<LectureSessionResponse, LectureQuestion> = {

  loadSession: async (setup) => {
    return store.dispatch(lectureApi.endpoints.startLectureSession.initiate({
      textId:     Number(setup.textId),
      difficulty: setup.difficulty as string | undefined,
    })).unwrap();
  },

  getQuestions: (session) => session.questions,

  preamble: (session) => {
    const first = session.questions[0];
    if (!first) return null;
    return (
      <div className="LectureText LectureText--preamble">
        <p className="LectureText__titre">{first.text_titre}</p>
        <p className="LectureText__body">{first.text_contenu}</p>
      </div>
    );
  },

  renderPrompt: (question) => <LecturePromptView key={question.item_key} question={question} />,

  qcm: {
    getChoices: (q) => q.choices.map((c) => ({ key: c, label: c })),
    correctKey: (q) => q.answer,
    layout: 'list',
  },

  correctionLabel: (question) => question.answer,

  fiche: lectureFiche,

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(lectureApi.endpoints.recordLectureAnswer.initiate({
      sessionId,
      itemKey:   question.item_key,
      isCorrect: correct,
    })).unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(lectureApi.endpoints.completeLectureSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),

  buildResultEntry: (question, given, correct, timeout) => ({
    label:    question.display,
    given:    typeof given === 'string' ? given : null,
    expected: question.answer,
    correct,
    timeout,
  }),

  showQuestionTag: true,
};