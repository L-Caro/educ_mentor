import store from 'src/store';
import { compteApi } from './compte.api';
import type { GameModuleSpec } from 'src/types/game.types';
import type { CompteQuestion, CompteSessionResponse } from './compte.type';
import ComptePlateau from './ComptePlateau';
import { compteFiche } from './compte.fiche';
import { atteint, decode, ecart, estCorrecte } from './compteValue';
import './compte.scss';

export const compteGameSpec: GameModuleSpec<
  CompteSessionResponse,
  CompteQuestion
> = {
  loadSession: (setup) =>
    store
      .dispatch(
        compteApi.endpoints.startCompteSession.initiate({
          difficulty: setup.difficulty as string | undefined,
          operations: setup.operations as string[] | undefined,
        }),
      )
      .unwrap(),

  // La cible est affichée par le plateau, au-dessus des plaques : elle doit rester sous
  // les yeux pendant toute la recherche, pas seulement à l'énoncé.
  renderPrompt: () => null,

  free: {
    parse: (raw) => raw,
    isCorrect: (question, given) =>
      typeof given === 'string' && estCorrecte(question, decode(given)),
    // Une étape suffit à valider. Rien n'oblige à s'arrêter là, mais valider un plateau
    // vide n'aurait rien à juger.
    isReady: (_question, input) => decode(input).length > 0,
    inputComponent: ComptePlateau,
  },

  fiche: compteFiche,

  correctionLabel: (question) => String(question.cible),

  recordAnswer: (sessionId, question, correct) =>
    store
      .dispatch(
        compteApi.endpoints.recordCompteAnswer.initiate({
          sessionId,
          skillKey: question.skill_key,
          isCorrect: correct,
        }),
      )
      .unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store
      .dispatch(
        compteApi.endpoints.completeCompteSession.initiate({
          sessionId,
          correctAnswers,
          totalQuestions,
        }),
      )
      .unwrap(),

  /** L'écran de résultats annonce L'ÉCART, pas seulement l'échec.
   *
   * « 348 au lieu de 350 » et « 12 au lieu de 350 » sont deux choses très différentes :
   * la première est une recherche qui a presque abouti, la seconde un abandon. Les
   * afficher pareil effacerait la seule information utile de la ligne. */
  buildResultEntry: (question, given, correct, timeout) => {
    const brut = typeof given === 'string' ? given : '';
    const resultat = atteint(question, brut);
    const distance = ecart(question, brut);
    return {
      label: `${question.cible} avec ${question.plaques.join(' · ')}`,
      given:
        resultat === null
          ? null
          : correct
            ? String(resultat)
            : `${resultat} (à ${distance} près)`,
      expected: String(question.cible),
      correct,
      timeout,
    };
  },

  emptyError: 'Aucun compte à chercher avec ces opérations.',
  showQuestionTag: true,
};
