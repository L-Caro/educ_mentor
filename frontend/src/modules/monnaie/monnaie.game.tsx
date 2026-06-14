import type { MonnaieExerciseType, MonnaieQuestion, MonnaieSessionResponse } from "src/modules/monnaie/monnaie.type.ts";
import store from 'src/store';
import { monnaieApi } from './monnaie.api.ts';
import { formatCents, getMonnaieImageUrl, parseMoneyInput } from './constants/denominations.ts';
import GamePrompt from 'src/components/game/engine/GamePrompt.tsx';
import type { GameModuleSpec } from 'src/types/game.types.ts';
import './monnaie.scss';

const EXERCISE_PROMPTS: Record<MonnaieExerciseType, string> = {
  reconnaitre: 'Combien y a-t-il en tout ?',
  total: 'Quel est le total à payer ?',
  rendre: 'Combien rend-on ?',
};

/** Résumé textuel de l'énoncé pour la liste d'erreurs. */
function questionSummary(question: MonnaieQuestion): string {
  switch (question.type) {
    case 'reconnaitre': return `${(question.coins ?? []).length} pièce(s)/billet(s)`;
    case 'total': return `Total de ${(question.prices ?? []).map(formatCents).join(' + ')}`;
    case 'rendre': return `${formatCents(question.price ?? 0)} → tu donnes ${formatCents(question.payment ?? 0)}`;
  }
}

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
            <span key={priceIndex} className="MonnaieGame__price-tag">
              {formatCents(price)}
            </span>
          ))}
        </div>
      );
    case 'rendre':
      return (
        <div className="MonnaieGame__receipt">
          <div className="MonnaieGame__receipt-row">
            <span className="MonnaieGame__receipt-label">Article</span>
            <span className="MonnaieGame__receipt-value">{formatCents(question.price ?? 0)}</span>
          </div>
          <div className="MonnaieGame__receipt-row">
            <span className="MonnaieGame__receipt-label">Tu donnes</span>
            <span className="MonnaieGame__receipt-value">{formatCents(question.payment ?? 0)}</span>
          </div>
        </div>
      );
  }
}

export const monnaieGameSpec: GameModuleSpec<MonnaieSessionResponse, MonnaieQuestion> = {
  loadSession: (setup) => {
    const exerciseType = setup.exerciseType as MonnaieExerciseType | undefined;
    if (!exerciseType) return Promise.reject(new Error("Type d'exercice manquant."));
    return store.dispatch(monnaieApi.endpoints.startMonnaieSession.initiate({
      exerciseType,
      difficulty: setup.difficulty as string | undefined,
    })).unwrap();
  },

  renderPrompt: (question) => (
    <GamePrompt>
      <p>{EXERCISE_PROMPTS[question.type]}</p>
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

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(monnaieApi.endpoints.recordMonnaieAnswer.initiate({
      sessionId, exerciseType: question.type, answerValue: question.answer, isCorrect: correct,
    })).unwrap(),
  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(monnaieApi.endpoints.completeMonnaieSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),
  buildResultEntry: (question, given, correct, timeout) => {
    const cents = given == null ? null : Number(given);
    return {
      label: questionSummary(question),
      given: cents === null || Number.isNaN(cents) || cents < 0 ? null : formatCents(cents),
      expected: formatCents(question.answer),
      correct,
      timeout,
    };
  },

  showQuestionTag: true,
};
