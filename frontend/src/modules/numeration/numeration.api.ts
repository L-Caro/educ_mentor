import type { ProgressionStat } from 'src/types/modules.types';
import type { NumerationSessionResponse } from './numeration.type';
import { baseApi } from 'src/store/api/baseApi';

export const numerationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startNumerationSession: builder.mutation<
      NumerationSessionResponse,
      { questionTypes?: string[] }
    >({
      query: ({ questionTypes }) => ({
        url: '/numeration/session',
        method: 'POST',
        body: { question_types: questionTypes },
      }),
    }),

    recordNumerationAnswer: builder.mutation<
      void,
      { sessionId: string; itemKey: string; isCorrect: boolean }
    >({
      query: ({ sessionId, itemKey, isCorrect }) => ({
        url: `/numeration/session/${sessionId}/answer`,
        method: 'POST',
        body: { itemKey, isCorrect },
      }),
    }),

    completeNumerationSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/numeration/session/${sessionId}/complete`,
        method: 'POST',
        body: { correctAnswers, totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'numeration' }],
    }),

    getNumerationProgression: builder.query<ProgressionStat[], void>({
      query: () => '/numeration/progression',
      providesTags: [{ type: 'Progression', id: 'numeration' }],
    }),

    resetNumerationProgression: builder.mutation<void, void>({
      query: () => ({ url: '/numeration/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'numeration' }],
    }),
  }),
});