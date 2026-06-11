import store from 'src/store';
import { imagierApi } from './imagier.api.ts';
import type { ImagierQuestion, ImagierSessionResponse } from 'src/types';
import { capitalize } from 'src/utils/capitilize.ts';
import GamePrompt from 'src/components/game/GamePrompt.tsx';
import type { GameModuleSpec } from 'src/components/game/GameEngine.tsx';

/** Comparaison insensible à la casse et aux accents (saisie libre, niveau difficile). */
function normalize(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export const imagierGameSpec: GameModuleSpec<ImagierSessionResponse, ImagierQuestion> = {
  loadSession: (setup) =>
    store.dispatch(imagierApi.endpoints.startImagierSession.initiate({
      categories: setup.categories as string[] | undefined,
      difficulty: setup.difficulty as string | undefined,
      mode: setup.mode as string | undefined,
    })).unwrap(),

  renderPrompt: (question, answerState) => {
    const hideImage = question.direction === 'en_to_fr' && answerState === 'idle';
    return (
      <GamePrompt imageUrl={question.image_url} imageHidden={hideImage} imageAlt={question.prompt}>
        <div className="ImagierGame__promptCard">
          <p className="ImagierGame__prompt">{capitalize(question.prompt)}</p>
        </div>
      </GamePrompt>
    );
  },

  qcm: {
    getChoices: (question) => question.choices.map((choice) => ({ key: choice.id, label: capitalize(choice.label) })),
    correctKey: (question) => question.correct_id,
  },

  free: {
    parse: (raw) => raw.trim(),
    isCorrect: (question, given) => normalize(String(given)) === normalize(question.answer),
    inputProps: { variant: 'text', placeholder: 'Tape la réponse…' },
  },

  correctionLabel: (question) => capitalize(question.answer),

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(imagierApi.endpoints.recordImagierAnswer.initiate({
      sessionId, wordId: question.word_id, isCorrect: correct,
    })).unwrap(),
  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(imagierApi.endpoints.completeImagierSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),
  buildResultEntry: (question, given, correct, timeout) => {
    const givenLabel = given == null
      ? null
      : question.choices.find((choice) => choice.id === given)?.label ?? String(given);
    return {
      label: capitalize(question.prompt),
      given: givenLabel ? capitalize(givenLabel) : null,
      expected: capitalize(question.answer),
      correct,
      timeout,
      thumbUrl: question.image_url,
    };
  },

  emptyError: "Aucun mot disponible. Active des mots dans l'administration.",
};
