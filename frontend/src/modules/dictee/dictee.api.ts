import type { ProgressionStat } from 'src/types/modules.types.ts';
import { baseApi } from 'src/store/api/baseApi.ts';
import type {
  DicteeImportReport,
  DicteeItem,
  DicteeSessionResponse,
  DicteeWordError,
} from './dictee.type.ts';

export const dicteeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ──────────────────────────────────────────────────────────────────
    getDicteeNotions: builder.query<string[], string | undefined>({
      query: (niveau) => ({
        url: '/dictee/notions',
        params: niveau ? { niveau } : undefined,
      }),
      providesTags: [{ type: 'Progression', id: 'dictee-notions' }],
    }),

    startDicteeSession: builder.mutation<
      DicteeSessionResponse,
      { niveau: string; longueur: string; notion?: string; preparee?: boolean }
    >({
      query: (body) => ({ url: '/dictee/session', method: 'POST', body }),
    }),

    completeDicteeSession: builder.mutation<
      void,
      { sessionId: string; wrongWords: string[] }
    >({
      query: ({ sessionId, wrongWords }) => ({
        url: `/dictee/session/${sessionId}/complete`,
        method: 'POST',
        body: { wrongWords },
      }),
      invalidatesTags: [
        { type: 'Progression', id: 'dictee' },
        { type: 'Progression', id: 'dictee-mots' },
      ],
    }),

    // ─── Progression ──────────────────────────────────────────────────────────
    getDicteeProgression: builder.query<ProgressionStat[], void>({
      query: () => '/dictee/progression',
      providesTags: [{ type: 'Progression', id: 'dictee' }],
    }),

    getDicteeWordErrors: builder.query<DicteeWordError[], void>({
      query: () => '/dictee/mots-difficiles',
      providesTags: [{ type: 'Progression', id: 'dictee-mots' }],
    }),

    resetDicteeProgression: builder.mutation<void, void>({
      query: () => ({ url: '/dictee/progression', method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Progression', id: 'dictee' },
        { type: 'Progression', id: 'dictee-mots' },
      ],
    }),

    // ─── Admin — items ────────────────────────────────────────────────────────
    getDicteeItems: builder.query<
      DicteeItem[],
      { niveau?: string; is_active?: boolean } | void
    >({
      query: (filters) => ({
        url: '/dictee/items',
        params: filters ?? undefined,
      }),
      providesTags: ['DicteeItems'],
    }),

    updateDicteeItem: builder.mutation<
      DicteeItem,
      { id: string } & Partial<Pick<DicteeItem, 'niveau' | 'contenu' | 'notions' | 'is_active'>>
    >({
      query: ({ id, ...patch }) => ({
        url: `/dictee/items/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: ['DicteeItems', { type: 'Progression', id: 'dictee-notions' }],
    }),

    deleteDicteeItem: builder.mutation<void, string>({
      query: (id) => ({ url: `/dictee/items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['DicteeItems', { type: 'Progression', id: 'dictee-notions' }],
    }),

    importDicteeJson: builder.mutation<
      DicteeImportReport,
      { json: string; replace?: boolean; activate?: boolean }
    >({
      query: (body) => ({ url: '/dictee/import', method: 'POST', body }),
      invalidatesTags: [
        'DicteeItems',
        { type: 'Progression', id: 'dictee-notions' },
      ],
    }),
  }),
});

export const {
  useGetDicteeNotionsQuery,
  useStartDicteeSessionMutation,
  useCompleteDicteeSessionMutation,
  useGetDicteeProgressionQuery,
  useGetDicteeWordErrorsQuery,
  useResetDicteeProgressionMutation,
  useGetDicteeItemsQuery,
  useUpdateDicteeItemMutation,
  useDeleteDicteeItemMutation,
  useImportDicteeJsonMutation,
} = dicteeApi;
