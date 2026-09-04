import store from 'src/store';
import { accordsApi } from './accords.api';
import AccordsPrompt from './AccordsPrompt';
import AccordsExemple from './AccordsExemple';
import { accordsFiche } from './accords.fiche';
import { reponseCorrecte } from './accords.reponse';
import type { AccordsQuestion, AccordsSessionResponse } from './accords.type';
import type { GameModuleSpec } from 'src/types/game.types';
import './accords.scss';

/** Deux exercices en QCM (le genre, et le choix d'une forme parmi celles du mot), trois en
 * saisie libre (écrire un pluriel, un groupe nominal, ou choisir la forme du verbe).
 *
 * Le moteur dérive le mode de la seule présence de choix : `getChoices` vide = saisie
 * libre. Aucun aiguillage explicite à écrire ici, contrairement au module grammaire qui
 * doit distinguer QCM et sélection sur la phrase. */
export const accordsGameSpec: GameModuleSpec<
  AccordsSessionResponse,
  AccordsQuestion
> = {
  loadSession: async (setup) => {
    const questionTypes = (setup.questionTypes as string[] | undefined) ?? [];
    return store
      .dispatch(
        accordsApi.endpoints.startAccordsSession.initiate({
          difficulty: setup.difficulty as string | undefined,
          question_types: questionTypes,
        }),
      )
      .unwrap();
  },

  getQuestions: (session) => session.questions,

  renderPrompt: (question) => (
    <AccordsPrompt key={question.item_key} question={question} />
  ),

  qcm: {
    getChoices: (question) =>
      question.choices.map((choice) => ({ key: choice, label: choice })),
    correctKey: (question) => question.answer,
    layout: 'list',
  },

  free: {
    parse: (raw) => raw.trim(),
    // La validation NE normalise PAS les accents, contrairement à `geometrie.game.tsx` :
    // ici l'orthographe est la réponse, cf. `accords.reponse.ts`.
    isCorrect: (question, given) =>
      typeof given === 'string' && reponseCorrecte(question.answer, given),
    inputProps: (question) => ({
      variant: 'text' as const,
      // Un groupe nominal entier tient en une quarantaine de caractères ; un nom seul
      // beaucoup moins, et une limite serrée évite les saisies parties de travers.
      maxLength: question.type === 'accord_gn' ? 48 : 24,
      placeholder: question.type === 'accord_gn' ? 'tout le groupe' : undefined,
      inputMode: 'text' as const,
    }),
  },

  correctionLabel: (question) => <AccordsExemple question={question} />,

  fiche: accordsFiche,

  recordAnswer: (sessionId, question, correct) =>
    store
      .dispatch(
        accordsApi.endpoints.recordAccordsAnswer.initiate({
          sessionId,
          skillKey: question.skill_key,
          isCorrect: correct,
        }),
      )
      .unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store
      .dispatch(
        accordsApi.endpoints.completeAccordsSession.initiate({
          sessionId,
          correctAnswers,
          totalQuestions,
        }),
      )
      .unwrap(),

  buildResultEntry: (question, given, correct, timeout) => ({
    // L'énoncé sans le trou : « un chat → des … » reste lisible dans la liste d'erreurs,
    // « ⬚ » ne le serait pas.
    label: [question.depart, `${question.avant}…${question.apres}`.trim()]
      .filter(Boolean)
      .join(' → '),
    given: typeof given === 'string' && given.trim() ? given.trim() : null,
    expected: question.answer,
    correct,
    timeout,
  }),

  showQuestionTag: true,
};
