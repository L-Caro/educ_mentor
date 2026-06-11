import type { ProgressionStat } from 'src/modules.types.ts';
import type { TablesSessionResponse } from "src/modules/tables/tables.type.ts";
import { baseApi } from 'src/store/api/baseApi.ts';

/** Endpoints RTK Query propres au module Tables (co-localisés avec le module). */
export const tablesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu (impératif : déclenché par la spec via store.dispatch) ─────────────
    startTablesSession: builder.mutation<
      TablesSessionResponse,
      { selectedTables: number[]; difficulty?: string }
    >({
      query: ({ selectedTables, difficulty }) => ({
        url: '/tables/session',
        method: 'POST',
        body: { selected_tables: selectedTables, difficulty },
      }),
    }),
    recordTablesAnswer: builder.mutation<
      void,
      { sessionId: string; factorA: number; factorB: number; isCorrect: boolean }
    >({
      query: ({ sessionId, factorA, factorB, isCorrect }) => ({
        url: `/tables/session/${sessionId}/answer`,
        method: 'POST',
        body: { factor_a: factorA, factor_b: factorB, is_correct: isCorrect },
      }),
    }),
    completeTablesSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/tables/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'tables' }],
    }),

    // ─── Progression ────────────────────────────────────────────────────────────
    getTablesProgression: builder.query<ProgressionStat[], void>({
      query: () => '/tables/progression',
      providesTags: [{ type: 'Progression', id: 'tables' }],
    }),
    resetTablesProgression: builder.mutation<void, void>({
      query: () => ({ url: '/tables/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'tables' }],
    }),
  }),
});
