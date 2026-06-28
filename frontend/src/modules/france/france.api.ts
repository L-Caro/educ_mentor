import type { ProgressionStat } from 'src/types/modules.types.ts';
import type { FranceSessionResponse } from './france.type.ts';
import { baseApi } from 'src/store/api/baseApi.ts';

export const franceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ────────────────────────────────────────────────────────────────
    startFranceSession: builder.mutation<
      FranceSessionResponse,
      { difficulty?: string; questionTypes?: string[]; regions?: string[] }
    >({
      query: ({ difficulty, questionTypes, regions }) => ({
        url: '/france/session',
        method: 'POST',
        body: { difficulty, question_types: questionTypes, regions },
      }),
    }),

    recordFranceAnswer: builder.mutation<
      void,
      { sessionId: string; itemKey: string; isCorrect: boolean }
    >({
      query: ({ sessionId, itemKey, isCorrect }) => ({
        url: `/france/session/${sessionId}/answer`,
        method: 'POST',
        body: { item_key: itemKey, is_correct: isCorrect },
      }),
    }),

    completeFranceSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/france/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'france' }],
    }),

    // ─── Admin ──────────────────────────────────────────────────────────────
    getFranceRegions: builder.query<{ code: string; nom: string; dept_count: number }[], void>({
      query: () => '/france/regions',
    }),

    getFranceDepartements: builder.query<{ code: string; nom: string; numero: string; region: string }[], void>({
      query: () => '/france/departements',
    }),

    getFranceProgression: builder.query<ProgressionStat[], void>({
      query: () => '/france/progression',
      providesTags: [{ type: 'Progression', id: 'france' }],
    }),

    resetFranceProgression: builder.mutation<void, void>({
      query: () => ({ url: '/france/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'france' }],
    }),
  }),
});

export const { useGetFranceRegionsQuery } = franceApi;
