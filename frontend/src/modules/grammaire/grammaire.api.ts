import type { ProgressionStat } from 'src/types/modules.types';
import { baseApi } from 'src/store/api/baseApi';
import type {
  GrammaireProgressionStat,
  GrammaireSessionResponse,
  NotionKey,
  NotionMeta,
} from './grammaire.type';

export const grammaireApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ──────────────────────────────────────────────────────────────────
    startGrammaireSession: builder.mutation<
      GrammaireSessionResponse,
      { difficulty?: string; question_types?: string[] }
    >({
      query: (body) => ({ url: '/grammaire/session', method: 'POST', body }),
    }),

    recordGrammaireAnswer: builder.mutation<
      void,
      { sessionId: string; skillKey: string; isCorrect: boolean }
    >({
      query: ({ sessionId, skillKey, isCorrect }) => ({
        url: `/grammaire/session/${sessionId}/answer`,
        method: 'POST',
        body: { skill_key: skillKey, is_correct: isCorrect },
      }),
    }),

    completeGrammaireSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/grammaire/session/${sessionId}/complete`,
        method: 'POST',
        body: {
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
        },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'grammaire' }],
    }),

    // ─── Progression ──────────────────────────────────────────────────────────
    getGrammaireProgression: builder.query<ProgressionStat[], void>({
      query: () => '/grammaire/progression',
      providesTags: [{ type: 'Progression', id: 'grammaire' }],
    }),

    /** La même route, typée avec `skill_key` : la vue de progression commune ne garde
     * que les compteurs, l'écran d'administration a besoin de la notion. */
    getGrammaireProgressionParNotion: builder.query<
      GrammaireProgressionStat[],
      void
    >({
      query: () => '/grammaire/progression',
      providesTags: [{ type: 'Progression', id: 'grammaire' }],
    }),

    resetGrammaireProgression: builder.mutation<void, void>({
      query: () => ({ url: '/grammaire/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'grammaire' }],
    }),

    // ─── Admin — classes de phrases ──────────────────────────────────────────
    getGrammaireClasses: builder.query<
      { key: string; label: string; phrases: number; defaultActive: boolean }[],
      void
    >({
      query: () => '/grammaire/classes',
    }),

    getGrammaireActiveClasses: builder.query<string[], void>({
      query: () => '/grammaire/classes-actives',
      providesTags: ['GrammaireActiveClasses'],
    }),

    updateGrammaireActiveClasses: builder.mutation<string[], string[]>({
      query: (keys) => ({
        url: '/grammaire/classes-actives',
        method: 'PATCH',
        body: { keys },
      }),
      invalidatesTags: ['GrammaireActiveClasses'],
    }),

    // ─── Admin — notions actives ──────────────────────────────────────────────
    getGrammaireNotions: builder.query<NotionMeta[], void>({
      query: () => '/grammaire/notions',
    }),

    getGrammaireActiveNotions: builder.query<NotionKey[], void>({
      query: () => '/grammaire/notions-actives',
      providesTags: ['GrammaireActiveNotions'],
    }),

    updateGrammaireActiveNotions: builder.mutation<NotionKey[], NotionKey[]>({
      query: (keys) => ({
        url: '/grammaire/notions-actives',
        method: 'PATCH',
        body: { keys },
      }),
      invalidatesTags: ['GrammaireActiveNotions'],
    }),
  }),
});

export const {
  useGetGrammaireClassesQuery,
  useGetGrammaireActiveClassesQuery,
  useUpdateGrammaireActiveClassesMutation,
  useStartGrammaireSessionMutation,
  useRecordGrammaireAnswerMutation,
  useCompleteGrammaireSessionMutation,
  useGetGrammaireProgressionQuery,
  useGetGrammaireProgressionParNotionQuery,
  useResetGrammaireProgressionMutation,
  useGetGrammaireNotionsQuery,
  useGetGrammaireActiveNotionsQuery,
  useUpdateGrammaireActiveNotionsMutation,
} = grammaireApi;
