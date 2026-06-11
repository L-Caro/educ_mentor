import { startCalculSession, recordCalculAnswer, completeCalculSession } from 'src/api/module/calcul.api';
import type { CalculSessionResponse, CalculQuestion } from 'src/types';
import type { CalculHistoryEntry } from './child/CalculResult';
import GamePrompt from 'src/components/common/Game/GamePrompt';
import type { GameModuleSpec } from 'src/components/common/Game/GameEngine';

function renderOperation(operation: string) {
  const parts = operation.split('?');
  if (parts.length !== 2) return <>{operation}</>;
  return (
    <>{parts[0]}<span className="CalculGame__blank">?</span>{parts[1]}</>
  );
}

export const calculGameSpec: GameModuleSpec<CalculSessionResponse, CalculQuestion, CalculHistoryEntry> = {
  loadSession: (setup) =>
    startCalculSession(setup.operationTypes as string[] | undefined, setup.difficulty as string | undefined),

  renderPrompt: (question) => (
    <GamePrompt>
      <p className="CalculGame__operation">{renderOperation(question.operation)}</p>
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

  recordAnswer: (sessionId, question, correct) => recordCalculAnswer(sessionId, question.answer, correct),
  completeSession: completeCalculSession,
  buildResultEntry: (question, given, correct, timeout) => ({
    operation: question.operation,
    answer: question.answer,
    given: typeof given === 'number' ? given : null,
    correct,
    timeout,
  }),
  buildResultsState: (correctCount, total, history) => ({ correctCount, total, history }),

  showQuestionTag: true,
};
