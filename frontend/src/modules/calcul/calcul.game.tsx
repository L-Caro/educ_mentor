import type { CalculQuestion, CalculSessionResponse } from "src/modules/calcul/calcul.type.ts";
import store from 'src/store';
import { calculApi } from './calcul.api.ts';
import GamePrompt from 'src/components/game/GamePrompt.tsx';
import type { GameModuleSpec } from 'src/types/game.types.ts';

function renderOperation(operation: string) {
  const parts = operation.split('?');
  if (parts.length !== 2) return <>{operation}</>;
  return (
    <>{parts[0]}<span>?</span>{parts[1]}</>
  );
}

export const calculGameSpec: GameModuleSpec<CalculSessionResponse, CalculQuestion> = {
  loadSession: (setup) =>
    store.dispatch(calculApi.endpoints.startCalculSession.initiate({
      operationTypes: setup.operationTypes as string[] | undefined,
      difficulty: setup.difficulty as string | undefined,
    })).unwrap(),

  renderPrompt: (question) => (
    <GamePrompt>
      <p>{renderOperation(question.operation)}</p>
    </GamePrompt>
  ),

  qcm: {
    getChoices: (question) => question.choices.map((choice) => ({ key: String(choice), label: choice })),
    correctKey: (question) => String(question.answer),
  },

  free: {
    parse: (raw) => parseInt(raw.trim(), 10),
    isCorrect: (question, given) => typeof given === 'number' && !isNaN(given) && given === question.answer,
    inputProps: { numeric: true, maxLength: 3, placeholder: '?' },
  },

  correctionLabel: (question) => question.answer,

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(calculApi.endpoints.recordCalculAnswer.initiate({
      sessionId, answerValue: question.answer, isCorrect: correct,
    })).unwrap(),
  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(calculApi.endpoints.completeCalculSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),
  buildResultEntry: (question, given, correct, timeout) => {
    const value = given == null ? null : Number(given);
    return {
      label: question.operation.replace('?', '___'),
      given: value === null || Number.isNaN(value) ? null : value,
      expected: question.answer,
      correct,
      timeout,
    };
  },

  showQuestionTag: true,
};
