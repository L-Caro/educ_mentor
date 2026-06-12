import type { ProgressionStat } from 'src/types/modules.types.ts';
import type { MonnaieSessionResponse } from "src/modules/monnaie/monnaie.type.ts";
import { baseApi } from 'src/store/api/baseApi.ts';

/** Endpoints RTK Query propres au module Monnaie (co-localisés avec le module). */
export const monnaieApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu (impératif : déclenché par la spec via store.dispatch) ─────────────
    startMonnaieSession: builder.mutation<
      MonnaieSessionResponse,
      { exerciseType: string; difficulty?: string }
    >({
      query: ({ exerciseType, difficulty }) => ({
        url: '/monnaie/session',
        method: 'POST',
        body: { exercise_type: exerciseType, difficulty },
      }),
    }),
    recordMonnaieAnswer: builder.mutation<
      void,
      { sessionId: string; exerciseType: string; answerValue: number; isCorrect: boolean }
    >({
      query: ({ sessionId, exerciseType, answerValue, isCorrect }) => ({
        url: `/monnaie/session/${sessionId}/answer`,
        method: 'POST',
        body: { exercise_type: exerciseType, answer_value: answerValue, is_correct: isCorrect },
      }),
    }),
    completeMonnaieSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/monnaie/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'monnaie' }],
    }),

    // ─── Progression ────────────────────────────────────────────────────────────
    getMonnaieProgression: builder.query<ProgressionStat[], void>({
      query: () => '/monnaie/progression',
      providesTags: [{ type: 'Progression', id: 'monnaie' }],
    }),
    resetMonnaieProgression: builder.mutation<void, void>({
      query: () => ({ url: '/monnaie/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'monnaie' }],
    }),
  }),
});
