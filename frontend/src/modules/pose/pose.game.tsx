import store from 'src/store';
import { poseApi } from './pose.api';
import type { GameModuleSpec } from 'src/types/game.types';
import type { PoseQuestion, PoseSessionResponse } from './pose.type';
import PoseGrid from './PoseGrid';
import { poseFiche } from './pose.fiche';
import { decode, encode, estComplete, estCorrecte, saisieInitiale } from './poseValue';
import './pose.scss';

export const poseGameSpec: GameModuleSpec<PoseSessionResponse, PoseQuestion> = {
  loadSession: (setup) =>
    store
      .dispatch(
        poseApi.endpoints.startPoseSession.initiate({
          difficulty: setup.difficulty as string | undefined,
          operations: setup.operations as string[] | undefined,
        }),
      )
      .unwrap(),

  // Atelier, pas course : le serveur renvoie toujours 0, on le rend explicite ici aussi.
  getTimerSeconds: () => 0,

  renderPrompt: () => null,

  free: {
    // La grille porte toute la saisie ; `value` est sa sérialisation.
    parse: (raw) => raw,
    isCorrect: (question, given) =>
      typeof given === 'string' && estCorrecte(question, decode(given, question)),
    isReady: (question, input) => estComplete(question, decode(input, question)),
    inputComponent: PoseGrid,
  },

  fiche: poseFiche,

  correctionLabel: (question) => String(question.answer),

  recordAnswer: (sessionId, question, correct) =>
    store
      .dispatch(
        poseApi.endpoints.recordPoseAnswer.initiate({
          sessionId,
          skillKey: question.skill_key,
          isCorrect: correct,
        }),
      )
      .unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store
      .dispatch(
        poseApi.endpoints.completePoseSession.initiate({
          sessionId,
          correctAnswers,
          totalQuestions,
        }),
      )
      .unwrap(),

  buildResultEntry: (question, given, correct, timeout) => ({
    label: `${question.operands[0]} ${question.operation === 'addition' ? '+' : '−'} ${question.operands[1]}`,
    given: typeof given === 'string' ? lireResultat(question, given) : null,
    expected: String(question.answer),
    correct,
    timeout,
  }),

  emptyError: 'Aucune opération à poser avec ces réglages.',
  showQuestionTag: true,
};

/** Le résultat saisi, relu de gauche à droite pour l'écran de résultats. */
function lireResultat(question: PoseQuestion, brut: string): string {
  const saisie = decode(brut, question);
  const lu = [...saisie.resultat].reverse().join('').replace(/^0+(?=\d)/, '');
  return lu || '—';
}

/** Réexporté pour que la grille initiale des retenues serve de valeur de départ. */
export { encode, saisieInitiale };
