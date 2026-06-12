import type { ProgressionStat } from 'src/types/modules.types.ts';
import type { CalculSessionResponse } from "src/modules/calcul/calcul.type.ts";
import { baseApi } from 'src/store/api/baseApi.ts';

/** Endpoints RTK Query propres au module Calcul Mental (co-localisés avec le module). */
export const calculApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu (impératif : déclenché par la spec via store.dispatch) ─────────────
    startCalculSession: builder.mutation<
      CalculSessionResponse,
      { operationTypes?: string[]; difficulty?: string }
    >({
      query: ({ operationTypes, difficulty }) => ({
        url: '/calcul/session',
        method: 'POST',
        body: { operation_types: operationTypes, difficulty },
      }),
    }),
    recordCalculAnswer: builder.mutation<
      void,
      { sessionId: string; answerValue: number; isCorrect: boolean }
    >({
      query: ({ sessionId, answerValue, isCorrect }) => ({
        url: `/calcul/session/${sessionId}/answer`,
        method: 'POST',
        body: { answer_value: answerValue, is_correct: isCorrect },
      }),
    }),
    completeCalculSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/calcul/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'calcul' }],
    }),

    // ─── Progression ────────────────────────────────────────────────────────────
    getCalculProgression: builder.query<ProgressionStat[], void>({
      query: () => '/calcul/progression',
      providesTags: [{ type: 'Progression', id: 'calcul' }],
    }),
    resetCalculProgression: builder.mutation<void, void>({
      query: () => ({ url: '/calcul/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'calcul' }],
    }),
  }),
});
