import { useState } from 'react';
import store from 'src/store';
import { lectureApi } from './lecture.api';
import type { LectureQuestion, LectureSessionResponse } from './lecture.type';
import type { GameModuleSpec } from 'src/types/game.types';
import './lecture.scss';

// ─── Rendu du texte avec surlignage optionnel ─────────────────────────────────

function renderTextBody(contenu: string, excerpt: string | null) {
  if (!excerpt) return <p className="LectureText__body">{contenu}</p>;
  const idx = contenu.indexOf(excerpt);
  if (idx === -1) return <p className="LectureText__body">{contenu}</p>;
  return (
    <p className="LectureText__body">
      {contenu.slice(0, idx)}
      <mark className="LectureText__highlight">{excerpt}</mark>
      {contenu.slice(idx + excerpt.length)}
    </p>
  );
}

// ─── Prompt de question ───────────────────────────────────────────────────────
// key={question.item_key} depuis renderPrompt → état reset à chaque nouvelle question

function LecturePromptView({ question }: { question: LectureQuestion }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="LecturePrompt">
      {question.show_text && (
        <div className="LecturePrompt__revealRow">
          <button
            type="button"
            className="LecturePrompt__revealBtn"
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? '🙈 Cacher le texte' : '📖 Voir le texte'}
          </button>
          {revealed && (
            <div className="LectureText">
              <p className="LectureText__titre">{question.text_titre}</p>
              {renderTextBody(question.text_contenu, question.excerpt)}
            </div>
          )}
        </div>
      )}
      <p className="LecturePrompt__question">{question.display}</p>
    </div>
  );
}

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