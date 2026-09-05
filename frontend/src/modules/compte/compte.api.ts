import { sharedApi } from 'src/store/api/sharedApi.ts';
import type { CompteSessionResponse } from './compte.type';

interface CompteOperationMeta {
  key: string;
  label: string;
  exemple: string;
  niveau: string;
}

export const compteApi = sharedApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Les opérations ACTIVES : pré-jeu. */
    getCompteOperations: builder.query<CompteOperationMeta[], void>({
      query: () => '/compte/operations',
      providesTags: ['CompteActiveOperations'],
    }),

    /** Le catalogue COMPLET, fermées comprises : administration. */
    getCompteCatalogue: builder.query<
      (CompteOperationMeta & { defaultActive: boolean })[],
      void
    >({
      query: () => '/compte/operations-catalogue',
    }),

    getCompteActiveOperations: builder.query<string[], void>({
      query: () => '/compte/operations-actives',
      providesTags: ['CompteActiveOperations'],
    }),

    updateCompteActiveOperations: builder.mutation<string[], string[]>({
      query: (keys) => ({
        url: '/compte/operations-actives',
        method: 'PATCH',
        body: { keys },
      }),
      invalidatesTags: ['CompteActiveOperations'],
    }),

    startCompteSession: builder.mutation<
      CompteSessionResponse,
      { difficulty?: string; operations?: string[] }
    >({
      query: (body) => ({ url: '/compte/session', method: 'POST', body }),
    }),

    recordCompteAnswer: builder.mutation<
      void,
      { sessionId: string; skillKey: string; isCorrect: boolean }
    >({
      query: ({ sessionId, skillKey, isCorrect }) => ({
        url: `/compte/session/${sessionId}/answer`,
        method: 'POST',
        body: { skill_key: skillKey, is_correct: isCorrect },
      }),
    }),

    completeCompteSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/compte/session/${sessionId}/complete`,
        method: 'POST',
        body: {
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
        },
      }),
    }),

    getCompteProgression: builder.query<
      {
        skill_key: string;
        is_mastered: boolean;
        correct_count: number;
        incorrect_count: number;
      }[],
      void
    >({
      query: () => '/compte/progression',
    }),

    resetCompteProgression: builder.mutation<void, void>({
      query: () => ({ url: '/compte/progression', method: 'DELETE' }),
    }),
  }),
});

export const {
  useGetCompteOperationsQuery,
  useGetCompteCatalogueQuery,
  useGetCompteActiveOperationsQuery,
  useUpdateCompteActiveOperationsMutation,
  useGetCompteProgressionQuery,
  useResetCompteProgressionMutation,
} = compteApi;
