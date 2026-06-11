import { startMonnaieSession, recordMonnaieAnswer, completeMonnaieSession } from 'src/api/module/monnaie.api';
import type { MonnaieSessionResponse, MonnaieQuestion, MonnaieExerciseType } from 'src/types';
import type { MonnaieHistoryEntry } from './child/MonnaieResult';
import { formatCents, getMonnaieImageUrl, parseMoneyInput } from './constants/denominations';
import GamePrompt from 'src/components/common/Game/GamePrompt';
import type { GameModuleSpec } from 'src/components/common/Game/GameEngine';

const EXERCISE_PROMPTS: Record<MonnaieExerciseType, string> = {
  reconnaitre: 'Combien y a-t-il en tout ?',
  total: 'Quel est le total à payer ?',
  rendre: 'Combien rend-on ?',
};

function renderQuestion(question: MonnaieQuestion) {
  switch (question.type) {
    case 'reconnaitre':
      return (
        <div className="MonnaieGame__coins">
          {(question.coins ?? []).map((coin, coinIndex) => (
            <img
              key={coinIndex}
              src={getMonnaieImageUrl(coin)}
              alt={formatCents(coin)}
              className={`MonnaieGame__coin${coin >= 500 ? ' MonnaieGame__coin--billet' : ''}`}
            />
          ))}
        </div>
      );
    case 'total':
      return (
        <div className="MonnaieGame__prices">
          {(question.prices ?? []).map((price, priceIndex) => (
            <span key={priceIndex} className="MonnaieGame__priceTag">
              {formatCents(price)}
            </span>
          ))}
        </div>
      );
    case 'rendre':
      return (
        <div className="MonnaieGame__scenario">
          <div className="MonnaieGame__scenarioLine">
            <span className="MonnaieGame__scenarioLabel">Article</span>
            <span className="MonnaieGame__scenarioValue">{formatCents(question.price ?? 0)}</span>
          </div>
          <div className="MonnaieGame__scenarioLine">
            <span className="MonnaieGame__scenarioLabel">Tu donnes</span>
            <span className="MonnaieGame__scenarioValue">{formatCents(question.payment ?? 0)}</span>
          </div>
        </div>
      );
  }
}

export const monnaieGameSpec: GameModuleSpec<MonnaieSessionResponse, MonnaieQuestion, MonnaieHistoryEntry> = {
  loadSession: (setup) => {
    const exerciseType = setup.exerciseType as MonnaieExerciseType | undefined;
    if (!exerciseType) return Promise.reject(new Error("Type d'exercice manquant."));
    return startMonnaieSession(exerciseType, setup.difficulty as string | undefined);
  },

  renderPrompt: (question) => (
    <GamePrompt>
      <p className="MonnaieGame__prompt">{EXERCISE_PROMPTS[question.type]}</p>
      {renderQuestion(question)}
    </GamePrompt>
  ),

  qcm: {
    getChoices: (question) => question.choices.map((choice) => ({ key: String(choice), label: formatCents(choice) })),
    correctKey: (question) => String(question.answer),
  },

  free: {
    parse: (raw) => parseMoneyInput(raw),
    isCorrect: (question, given) => typeof given === 'number' && given !== -1 && given === question.answer,
    inputProps: { inputMode: 'decimal', suffix: '€', maxLength: 8, placeholder: '0' },
  },

  correctionLabel: (question) => formatCents(question.answer),

  recordAnswer: (sessionId, question, correct) => recordMonnaieAnswer(sessionId, question.type, question.answer, correct),
  completeSession: completeMonnaieSession,
  buildResultEntry: (question, given, correct, timeout) => ({
    question,
    given: typeof given === 'number' ? given : null,
    correct,
    timeout,
  }),
  buildResultsState: (correctCount, total, history) => ({ correctCount, total, history }),

  showQuestionTag: true,
};
