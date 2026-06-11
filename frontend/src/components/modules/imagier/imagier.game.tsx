import { startSession, recordAnswer, completeSession } from 'src/api/module/imagier.api';
import type { ImagierQuestion, ImagierSessionResponse } from 'src/types';
import { capitalize } from 'src/utils/capitilize';
import GamePrompt from 'src/components/common/Game/GamePrompt';
import type { GameModuleSpec } from 'src/components/common/Game/GameEngine';

/** Comparaison insensible à la casse et aux accents (saisie libre, niveau difficile). */
function normalize(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export const imagierGameSpec: GameModuleSpec<ImagierSessionResponse, ImagierQuestion> = {
  loadSession: (setup) =>
    startSession(
      setup.categories as string[] | undefined,
      setup.difficulty as string | undefined,
      setup.mode as string | undefined,
    ),

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

  recordAnswer: (sessionId, question, correct) => recordAnswer(sessionId, question.word_id, correct),
  completeSession: completeSession,
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
