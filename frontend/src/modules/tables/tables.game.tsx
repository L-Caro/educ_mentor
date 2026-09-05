import type { TablesQuestion, TablesSessionResponse } from "src/modules/tables/tables.type.ts";
import store from 'src/store';
import { tablesApi } from './tables.api.ts';
import GamePrompt from 'src/components/game/engine/GamePrompt.tsx';
import type { GameModuleSpec } from 'src/types/game.types.ts';
import TableRappel from './TableRappel.tsx';
import './tables.scss';

export const tablesGameSpec: GameModuleSpec<TablesSessionResponse, TablesQuestion> = {
  loadSession: (setup) => {
    const tables = ((setup.tables as string[] | undefined) ?? []).map(Number).filter((value) => !isNaN(value));
    return store.dispatch(tablesApi.endpoints.startTablesSession.initiate({
      selectedTables: tables,
      difficulty: setup.difficulty as string | undefined,
    })).unwrap();
  },

  renderPrompt: (question) => (
    <GamePrompt>
      <p>
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

  /**
   * Fiche dérivée de la question : la table du plus PETIT facteur, avec la ligne cherchée
   * mise en avant. On récite toujours la plus petite (7 × 8 renvoie à la table de 7) parce
   * que c'est celle que l'enfant a apprise, et la commutativité fait le reste : c'est
   * justement l'idée clé de la fiche.
   *
   * Fonction pure : réutilisable telle quelle par le futur mode « école ».
   */
  fiche: (question) => {
    const [petit, grand] = question.display_a <= question.display_b
      ? [question.display_a, question.display_b]
      : [question.display_b, question.display_a];

    return {
      titre: `${question.display_a} × ${question.display_b}`,
      idee: `${petit} × ${grand} et ${grand} × ${petit} donnent le même résultat. Tu peux réciter celle que tu connais le mieux.`,
      regle: `${petit} × ${grand} = ${question.answer}`,
      exemple: <TableRappel table={petit} highlight={grand} />,
      piege: petit === 0 || grand === 0
        ? 'Multiplier par 0 donne toujours 0.'
        : petit === 1
          ? 'Multiplier par 1 ne change rien.'
          : undefined,
    };
  },

  recordAnswer: (sessionId, question, correct) =>
    store.dispatch(tablesApi.endpoints.recordTablesAnswer.initiate({
      sessionId, factorA: question.display_a, factorB: question.display_b, isCorrect: correct,
    })).unwrap(),
  completeSession: (sessionId, correctAnswers, totalQuestions) =>
    store.dispatch(tablesApi.endpoints.completeTablesSession.initiate({
      sessionId, correctAnswers, totalQuestions,
    })).unwrap(),
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
