import type { ProgressionStat } from 'src/types/modules.types.ts';
import type { HeureSessionResponse } from 'src/modules/heure/heure.type.ts';
import { baseApi } from 'src/store/api/baseApi.ts';

export const heureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ────────────────────────────────────────────────────────────────
    startHeureSession: builder.mutation<
      HeureSessionResponse,
      { difficulty?: string; numeralType?: string }
    >({
      query: ({ difficulty, numeralType }) => ({
        url: '/heure/session',
        method: 'POST',
        body: { difficulty, numeral_type: numeralType },
      }),
    }),

    recordHeureAnswer: builder.mutation<
      void,
      { sessionId: string; answerValue: number; isCorrect: boolean }
    >({
      query: ({ sessionId, answerValue, isCorrect }) => ({
        url: `/heure/session/${sessionId}/answer`,
        method: 'POST',
        body: { answer_value: answerValue, is_correct: isCorrect },
      }),
    }),

    completeHeureSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/heure/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'heure' }],
    }),

    // ─── Progression ────────────────────────────────────────────────────────
    getHeureProgression: builder.query<ProgressionStat[], void>({
      query: () => '/heure/progression',
      providesTags: [{ type: 'Progression', id: 'heure' }],
    }),

    resetHeureProgression: builder.mutation<void, void>({
      query: () => ({ url: '/heure/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'heure' }],
    }),
  }),
});