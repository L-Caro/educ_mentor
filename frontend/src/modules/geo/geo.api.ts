import type { ProgressionStat } from 'src/types/modules.types.ts';
import type { GeoSessionResponse } from './geo.type.ts';
import { baseApi } from 'src/store/api/baseApi.ts';

export const geoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ────────────────────────────────────────────────────────────────
    startGeoSession: builder.mutation<
      GeoSessionResponse,
      {
        difficulty?: string;
        questionTypes?: string[];
        continents?: string[];
        capitalDirection?: string;
      }
    >({
      query: ({ difficulty, questionTypes, continents, capitalDirection }) => ({
        url: '/geo/session',
        method: 'POST',
        body: {
          difficulty,
          question_types: questionTypes,
          continents,
          capital_direction: capitalDirection,
        },
      }),
    }),

    recordGeoAnswer: builder.mutation<
      void,
      { sessionId: string; itemKey: string; isCorrect: boolean }
    >({
      query: ({ sessionId, itemKey, isCorrect }) => ({
        url: `/geo/session/${sessionId}/answer`,
        method: 'POST',
        body: { item_key: itemKey, is_correct: isCorrect },
      }),
    }),

    completeGeoSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/geo/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'geo' }],
    }),

    // ─── Admin ──────────────────────────────────────────────────────────────
    getGeoCountries: builder.query<{ code: string; nom: string; drapeau: string; continent: string }[], void>({
      query: () => '/geo/countries',
    }),

    getGeoProgression: builder.query<ProgressionStat[], void>({
      query: () => '/geo/progression',
      providesTags: [{ type: 'Progression', id: 'geo' }],
    }),

    resetGeoProgression: builder.mutation<void, void>({
      query: () => ({ url: '/geo/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'geo' }],
    }),
  }),
});

export const { useGetGeoCountriesQuery } = geoApi;