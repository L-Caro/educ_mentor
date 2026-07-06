import type { ProgressionStat } from 'src/types/modules.types.ts';
import type { PenduSessionResponse, PenduWord } from './pendu.type.ts';
import { baseApi } from 'src/store/api/baseApi.ts';

export const penduApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startPenduSession: builder.mutation<PenduSessionResponse, { difficulty: string; letters_revealed?: number; word_length?: string }>({
      query: (body) => ({ url: '/pendu/session', method: 'POST', body }),
    }),

    completePenduSession: builder.mutation<void, { sessionId: string; won: boolean }>({
      query: ({ sessionId, won }) => ({
        url: `/pendu/session/${sessionId}/complete`,
        method: 'POST',
        body: { won },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'pendu' }],
    }),

    getPenduProgression: builder.query<ProgressionStat[], void>({
      query: () => '/pendu/progression',
      providesTags: [{ type: 'Progression', id: 'pendu' }],
    }),

    resetPenduProgression: builder.mutation<void, void>({
      query: () => ({ url: '/pendu/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'pendu' }],
    }),

    getPenduWords: builder.query<PenduWord[], { search?: string } | undefined>({
      query: (params) => ({ url: '/pendu/words', params }),
      providesTags: [{ type: 'Progression', id: 'pendu-words' }],
    }),

    createPenduWord: builder.mutation<PenduWord, Partial<PenduWord>>({
      query: (body) => ({ url: '/pendu/words', method: 'POST', body }),
      invalidatesTags: [{ type: 'Progression', id: 'pendu-words' }],
    }),

    updatePenduWord: builder.mutation<PenduWord, Partial<PenduWord> & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/pendu/words/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Progression', id: 'pendu-words' }],
    }),

    deletePenduWord: builder.mutation<void, string>({
      query: (id) => ({ url: `/pendu/words/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'pendu-words' }],
    }),
  }),
});

export const {
  useStartPenduSessionMutation,
  useCompletePenduSessionMutation,
  useGetPenduProgressionQuery,
  useResetPenduProgressionMutation,
  useGetPenduWordsQuery,
  useCreatePenduWordMutation,
  useUpdatePenduWordMutation,
  useDeletePenduWordMutation,
} = penduApi;