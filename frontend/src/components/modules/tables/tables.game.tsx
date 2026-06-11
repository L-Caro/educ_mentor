import { startTablesSession, recordTablesAnswer, completeTablesSession } from 'src/api/module/tables.api';
import type { TablesQuestion, TablesSessionResponse } from 'src/types';
import GamePrompt from 'src/components/common/Game/GamePrompt';
import type { GameModuleSpec } from 'src/components/common/Game/GameEngine';

export const tablesGameSpec: GameModuleSpec<TablesSessionResponse, TablesQuestion> = {
  loadSession: (setup) => {
    const tables = ((setup.tables as string[] | undefined) ?? []).map(Number).filter((value) => !isNaN(value));
    return startTablesSession(tables, setup.difficulty as string | undefined);
  },

  renderPrompt: (question) => (
    <GamePrompt>
      <p className="TablesGame__question">
        {question.display_a} × {question.display_b} = ?
      </p>
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
    recordTablesAnswer(sessionId, question.display_a, question.display_b, correct),
  completeSession: completeTablesSession,
  buildResultEntry: (question, given, correct, timeout) => {
    const value = given == null ? null : Number(given);
    return {
      label: `${question.display_a} × ${question.display_b}`,
      given: value === null || Number.isNaN(value) ? null : value,
      expected: question.answer,
      correct,
      timeout,
    };
  },

  emptyError: 'Aucune question disponible. Sélectionne au moins une table.',
  showStreak: true,
  showQuestionTag: true,
};
