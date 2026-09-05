import type { ProgressionStat } from 'src/types/modules.types';
import { baseApi } from 'src/store/api/baseApi';
import type {
  AccordsProgressionStat,
  AccordsSessionResponse,
  NotionKey,
  NotionMeta,
} from './accords.type';

export const accordsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ──────────────────────────────────────────────────────────────────
    startAccordsSession: builder.mutation<
      AccordsSessionResponse,
      { difficulty?: string; question_types?: string[] }
    >({
      query: (body) => ({ url: '/accords/session', method: 'POST', body }),
    }),

    recordAccordsAnswer: builder.mutation<
      void,
      { sessionId: string; skillKey: string; isCorrect: boolean }
    >({
      query: ({ sessionId, skillKey, isCorrect }) => ({
        url: `/accords/session/${sessionId}/answer`,
        method: 'POST',
        body: { skill_key: skillKey, is_correct: isCorrect },
      }),
    }),

    completeAccordsSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/accords/session/${sessionId}/complete`,
        method: 'POST',
        body: {
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
        },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'accords' }],
    }),

    // ─── Progression ──────────────────────────────────────────────────────────
    getAccordsProgression: builder.query<ProgressionStat[], void>({
      query: () => '/accords/progression',
      providesTags: [{ type: 'Progression', id: 'accords' }],
    }),

    /** La même route, typée avec `skill_key` : la vue de progression commune ne garde
     * que les compteurs, l'écran d'administration a besoin de la notion. */
    getAccordsProgressionParNotion: builder.query<
      AccordsProgressionStat[],
      void
    >({
      query: () => '/accords/progression',
      providesTags: [{ type: 'Progression', id: 'accords' }],
    }),

    resetAccordsProgression: builder.mutation<void, void>({
      query: () => ({ url: '/accords/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'accords' }],
    }),

    // ─── Admin : familles morphologiques ─────────────────────────────────────
    getAccordsFamilles: builder.query<
      {
        key: string;
        label: string;
        exemple: string;
        porte: 'nom' | 'adjectif';
        niveau: string;
        defaultActive: boolean;
      }[],
      void
    >({
      query: () => '/accords/familles',
    }),

    getAccordsActiveFamilles: builder.query<string[], void>({
      query: () => '/accords/familles-actives',
      providesTags: ['AccordsActiveFamilles'],
    }),

    updateAccordsActiveFamilles: builder.mutation<string[], string[]>({
      query: (keys) => ({
        url: '/accords/familles-actives',
        method: 'PATCH',
        body: { keys },
      }),
      invalidatesTags: ['AccordsActiveFamilles'],
    }),

    // ─── Admin : notions actives ──────────────────────────────────────────────
    getAccordsNotions: builder.query<NotionMeta[], void>({
      query: () => '/accords/notions',
    }),

    getAccordsActiveNotions: builder.query<NotionKey[], void>({
      query: () => '/accords/notions-actives',
      providesTags: ['AccordsActiveNotions'],
    }),

    updateAccordsActiveNotions: builder.mutation<NotionKey[], NotionKey[]>({
      query: (keys) => ({
        url: '/accords/notions-actives',
        method: 'PATCH',
        body: { keys },
      }),
      invalidatesTags: ['AccordsActiveNotions'],
    }),
  }),
});

export const {
  useGetAccordsFamillesQuery,
  useGetAccordsActiveFamillesQuery,
  useUpdateAccordsActiveFamillesMutation,
  useStartAccordsSessionMutation,
  useRecordAccordsAnswerMutation,
  useCompleteAccordsSessionMutation,
  useGetAccordsProgressionQuery,
  useGetAccordsProgressionParNotionQuery,
  useResetAccordsProgressionMutation,
  useGetAccordsNotionsQuery,
  useGetAccordsActiveNotionsQuery,
  useUpdateAccordsActiveNotionsMutation,
} = accordsApi;
