import type { ImagierSessionResponse } from 'src/types';
import type { ProgressionStat } from 'src/modules.types';
import { baseApi } from 'src/store/api/baseApi';

/** Endpoints RTK Query propres au module Imagier (co-localisés avec le module). */
export const imagierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu (impératif : déclenché par la spec via store.dispatch) ─────────────
    startImagierSession: builder.mutation<
      ImagierSessionResponse,
      { categories?: string[]; difficulty?: string; mode?: string }
    >({
      query: (body) => ({ url: '/imagier/session', method: 'POST', body }),
    }),
    recordImagierAnswer: builder.mutation<
      void,
      { sessionId: string; wordId: string; isCorrect: boolean }
    >({
      query: ({ sessionId, wordId, isCorrect }) => ({
        url: `/imagier/session/${sessionId}/answer`,
        method: 'POST',
        body: { word_id: wordId, is_correct: isCorrect },
      }),
    }),
    completeImagierSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/imagier/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'imagier' }],
    }),

    // ─── Progression ────────────────────────────────────────────────────────────
    getImagierProgression: builder.query<ProgressionStat[], void>({
      query: () => '/imagier/progression',
      // L'API Imagier renvoie les mots + leur progression (ou null) → on normalise ici.
      transformResponse: (rows: { progression: ProgressionStat | null }[]) =>
        rows.filter((row) => row.progression !== null).map((row) => row.progression!),
      providesTags: [{ type: 'Progression', id: 'imagier' }],
    }),
    resetImagierProgression: builder.mutation<void, void>({
      query: () => ({ url: '/imagier/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'imagier' }],
    }),
  }),
});
