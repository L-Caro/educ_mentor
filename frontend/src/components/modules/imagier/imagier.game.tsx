import { startSession, recordAnswer, completeSession } from 'src/api/module/imagier.api';
import type { ImagierQuestion, ImagierSessionResponse } from 'src/types';
import { capitalize } from 'src/utils/capitilize';
import GamePrompt from 'src/components/common/Game/GamePrompt';
import type { GameModuleSpec } from 'src/components/common/Game/GameEngine';

type ImagierResult = { question: ImagierQuestion; wasCorrect: boolean };

function correctLabel(question: ImagierQuestion): string {
  return question.choices.find((choice) => choice.id === question.correct_id)?.label ?? '';
}

/** Comparaison insensible à la casse et aux accents (saisie libre, niveau 3). */
function normalize(text: string): string {
  return text.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export const imagierGameSpec: GameModuleSpec<ImagierSessionResponse, ImagierQuestion, ImagierResult> = {
  loadSession: (setup) => startSession(setup.categories as string[] | undefined),
  // Le mode libre dépend de la difficulté de session (les choix restent présents en base).
  isFreeMode: (session) => session.difficulty === 'level_3',

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
    isCorrect: (question, given) => normalize(String(given)) === normalize(correctLabel(question)),
    inputProps: { variant: 'text', placeholder: 'Tape la réponse…' },
  },

  correctionLabel: (question) => capitalize(correctLabel(question)),

  recordAnswer: (sessionId, question, correct) => recordAnswer(sessionId, question.word_id, correct),
  completeSession: completeSession,
  buildResultEntry: (question, _given, correct) => ({ question, wasCorrect: correct }),

  emptyError: "Aucun mot disponible. Active des mots dans l'administration.",
};
