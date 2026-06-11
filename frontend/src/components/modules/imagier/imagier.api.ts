import type { ImagierWord, ImagierSessionResponse } from 'src/types';
import type { ProgressionStat } from 'src/modules.types';
import { baseApi } from 'src/store/api/baseApi';

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
      transformResponse: (rows: { progression: ProgressionStat | null }[]) =>
        rows.filter((row) => row.progression !== null).map((row) => row.progression!),
      providesTags: [{ type: 'Progression', id: 'imagier' }],
    }),
    resetImagierProgression: builder.mutation<void, void>({
      query: () => ({ url: '/imagier/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'imagier' }],
    }),

    // ─── Admin — mots ───────────────────────────────────────────────────────────
    getImagierWords: builder.query<
      ImagierWord[],
      { category?: string; is_active?: boolean; search?: string } | void
    >({
      query: (filters) => ({ url: '/imagier/words', params: filters ?? undefined }),
      providesTags: ['ImagierWords'],
    }),
    createImagierWord: builder.mutation<
      ImagierWord,
      { fr: string; en: string; category: string; subcategory?: string; is_active?: boolean }
    >({
      query: (body) => ({ url: '/imagier/words', method: 'POST', body }),
      invalidatesTags: ['ImagierWords'],
    }),
    updateImagierWord: builder.mutation<ImagierWord, { id: string } & Partial<ImagierWord>>({
      query: ({ id, ...patch }) => ({ url: `/imagier/words/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: ['ImagierWords'],
    }),
    deleteImagierWord: builder.mutation<void, string>({
      query: (wordId) => ({ url: `/imagier/words/${wordId}`, method: 'DELETE' }),
      invalidatesTags: ['ImagierWords'],
    }),
    uploadImagierWordImage: builder.mutation<ImagierWord, { wordId: string; file: File }>({
      query: ({ wordId, file }) => {
        const formData = new FormData();
        formData.append('file', file);
        return { url: `/imagier/words/${wordId}/image`, method: 'POST', body: formData };
      },
      invalidatesTags: ['ImagierWords'],
    }),

    // ─── Admin — catégories ─────────────────────────────────────────────────────
    normalizeImagierCategories: builder.mutation<{ updated: number }, void>({
      query: () => ({ url: '/imagier/normalize-categories', method: 'PATCH' }),
      invalidatesTags: ['ImagierCategories', 'ImagierWords'],
    }),

    // ─── Admin — import JSON ────────────────────────────────────────────────────
    importImagierJson: builder.mutation<
      { inserted: number; skipped: number; errors: string[] },
      { json: string; overwrite?: boolean }
    >({
      query: (body) => ({ url: '/imagier/import', method: 'POST', body }),
      invalidatesTags: ['ImagierWords', 'ImagierCategories'],
    }),
  }),
});

export const {
  useGetImagierWordsQuery,
  useCreateImagierWordMutation,
  useUpdateImagierWordMutation,
  useDeleteImagierWordMutation,
  useUploadImagierWordImageMutation,
  useNormalizeImagierCategoriesMutation,
  useImportImagierJsonMutation,
  useGetImagierProgressionQuery,
  useResetImagierProgressionMutation,
} = imagierApi;
