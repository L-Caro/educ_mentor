import type { ProgressionStat } from 'src/types/modules.types.ts';
import type { ConjugaisonSessionResponse } from './conjugaison.type.ts';
import { baseApi } from 'src/store/api/baseApi.ts';

export const conjugaisonApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ────────────────────────────────────────────────────────────────
    startConjugaisonSession: builder.mutation<
      ConjugaisonSessionResponse,
      {
        difficulty?: string;
        tenses?: string[];
        verbGroups?: string[];
        pronounDisplay?: string;
        questionDirection?: string;
      }
    >({
      query: ({ difficulty, tenses, verbGroups, pronounDisplay, questionDirection }) => ({
        url: '/conjugaison/session',
        method: 'POST',
        body: {
          difficulty,
          tenses,
          verb_groups: verbGroups,
          pronoun_display: pronounDisplay,
          question_direction: questionDirection,
        },
      }),
    }),

    recordConjugaisonAnswer: builder.mutation<
      void,
      { sessionId: string; verbTense: string; isCorrect: boolean }
    >({
      query: ({ sessionId, verbTense, isCorrect }) => ({
        url: `/conjugaison/session/${sessionId}/answer`,
        method: 'POST',
        body: { verb_tense: verbTense, is_correct: isCorrect },
      }),
    }),

    completeConjugaisonSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/conjugaison/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'conjugaison' }],
    }),

    // ─── Admin ──────────────────────────────────────────────────────────────
    getConjugaisonVerbs: builder.query<{ infinitif: string; groupe: string }[], void>({
      query: () => '/conjugaison/verbs',
    }),

    getConjugaisonProgression: builder.query<ProgressionStat[], void>({
      query: () => '/conjugaison/progression',
      providesTags: [{ type: 'Progression', id: 'conjugaison' }],
    }),

    resetConjugaisonProgression: builder.mutation<void, void>({
      query: () => ({ url: '/conjugaison/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'conjugaison' }],
    }),
  }),
});

export const { useGetConjugaisonVerbsQuery } = conjugaisonApi;