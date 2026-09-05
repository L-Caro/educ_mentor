import store from 'src/store';
import { grammaireApi } from './grammaire.api';
import GrammairePrompt from './GrammairePrompt';
import PhraseCliquable from './PhraseCliquable';
import PhraseMarquee from './PhraseMarquee';
import { grammaireFiche } from './grammaire.fiche';
import type {
  GrammaireQuestion,
  GrammaireSessionResponse,
} from './grammaire.type';
import type { GameModuleSpec } from 'src/types/game.types';
import './grammaire.scss';

/** `nature_mot` est un QCM ; les trois autres types sont de la sélection multiple sur la
 * phrase. Le moteur sait déjà faire les deux : `spec.map` avec `isMultiSelect` valide une
 * sélection de plusieurs clés, et c'est exactement ce que `france` utilise pour ses
 * régions. Un seul descripteur suffit donc, avec un aiguillage par type de question. */
function estSelection(question: GrammaireQuestion): boolean {
  return question.type !== 'nature_mot';
}

export const grammaireGameSpec: GameModuleSpec<
  GrammaireSessionResponse,
  GrammaireQuestion
> = {
  loadSession: async (setup) => {
    const questionTypes = (setup.questionTypes as string[] | undefined) ?? [];
    return store
      .dispatch(
        grammaireApi.endpoints.startGrammaireSession.initiate({
          difficulty: setup.difficulty as string | undefined,
          question_types: questionTypes,
        }),
      )
      .unwrap();
  },

  getQuestions: (session) => session.questions,

  renderPrompt: (question) => (
    <GrammairePrompt key={question.item_key} question={question} />
  ),

  qcm: {
    // Vide sur une question de sélection : le moteur dérive le mode des choix, et c'est
    // `map.isMapQuestion` qui prend la main avant lui.
    getChoices: (question) =>
      question.choices.map((choice) => ({ key: choice, label: choice })),
    correctKey: (question) => question.answer,
    layout: 'list',
  },

  map: {
    // Référence stable exigée par le contrat (cf. game.types.ts) : le composant est défini
    // au niveau module, ce qui varie passe par `getComponentProps`. Une closure ici serait
    // un type de composant neuf à chaque rendu, et React remonterait la phrase à chaque clic.
    getComponent: () => PhraseCliquable,
    getComponentProps: (question) => ({ mots: question.mots }),
    isMapQuestion: estSelection,
    isMultiSelect: () => true,
    correctKeys: (question) => question.answer_indices.map(String),
    // Jamais appelé : le moteur ne l'utilise qu'en sélection simple, et ce module est
    // toujours en multiple. Le contrat l'exige tout de même.
    isCorrect: (question, clicked) =>
      question.answer_indices.map(String).includes(clicked),
  },

  correctionLabel: (question) =>
    estSelection(question) ? (
      <PhraseMarquee
        mots={question.mots}
        marques={question.answer_indices}
        variante="surligne"
      />
    ) : (
      question.answer
    ),

  fiche: grammaireFiche,

  recordAnswer: (sessionId, question, correct) =>
    store
      .dispatch(
        grammaireApi.endpoints.recordGrammaireAnswer.initiate({
          sessionId,
          skillKey: question.skill_key,
          isCorrect: correct,
        }),
      )
      .unwrap(),

  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store
      .dispatch(
        grammaireApi.endpoints.completeGrammaireSession.initiate({
          sessionId,
          correctAnswers,
          totalQuestions,
        }),
      )
      .unwrap(),

  buildResultEntry: (question, given, correct, timeout) => ({
    label: question.display,
    given: estSelection(question)
      ? motsDe(question, given)
      : typeof given === 'string' && given
        ? given
        : null,
    expected: question.answer,
    correct,
    timeout,
  }),

  showQuestionTag: true,
};

/** Les mots effectivement touchés, recollés, pour la liste d'erreurs de fin de partie.
 * Sans ça, la ligne afficherait `["0","2"]` : des index bruts. */
function motsDe(question: GrammaireQuestion, given: unknown): string | null {
  if (!Array.isArray(given) || given.length === 0) return null;
  return given
    .map(Number)
    .filter((index) => Number.isInteger(index) && question.mots[index])
    .sort((a, b) => a - b)
    .map((index, rang) => {
      const mot = question.mots[index];
      return `${rang === 0 || mot.colle ? '' : ' '}${mot.mot}`;
    })
    .join('');
}
