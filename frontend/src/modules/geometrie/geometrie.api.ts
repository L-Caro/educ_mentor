import type { ProgressionStat } from 'src/types/modules.types';
import { baseApi } from 'src/store/api/baseApi';
import type { GeometrieSessionResponse, ShapeMeta } from './geometrie.type';

export const geometrieApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ──────────────────────────────────────────────────────────────────
    startGeometrieSession: builder.mutation<
      GeometrieSessionResponse,
      { difficulty?: string; question_types?: string[] }
    >({
      query: (body) => ({ url: '/geometrie/session', method: 'POST', body }),
    }),

    recordGeometrieAnswer: builder.mutation<
      void,
      { sessionId: string; skillKey: string; isCorrect: boolean }
    >({
      query: ({ sessionId, skillKey, isCorrect }) => ({
        url: `/geometrie/session/${sessionId}/answer`,
        method: 'POST',
        body: { skill_key: skillKey, is_correct: isCorrect },
      }),
    }),

    completeGeometrieSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/geometrie/session/${sessionId}/complete`,
        method: 'POST',
        body: {
          correct_answers: correctAnswers,
          total_questions: totalQuestions,
        },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'geometrie' }],
    }),

    // ─── Progression ──────────────────────────────────────────────────────────
    getGeometrieProgression: builder.query<ProgressionStat[], void>({
      query: () => '/geometrie/progression',
      providesTags: [{ type: 'Progression', id: 'geometrie' }],
    }),

    resetGeometrieProgression: builder.mutation<void, void>({
      query: () => ({ url: '/geometrie/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'geometrie' }],
    }),

    // ─── Admin : figures actives ────────────────────────────────────────────────
    getGeometrieShapes: builder.query<ShapeMeta[], void>({
      query: () => '/geometrie/shapes',
    }),

    getGeometrieActiveShapes: builder.query<string[], void>({
      query: () => '/geometrie/figures-actives',
      providesTags: ['GeometrieActiveShapes'],
    }),

    updateGeometrieActiveShapes: builder.mutation<string[], string[]>({
      query: (keys) => ({
        url: '/geometrie/figures-actives',
        method: 'PATCH',
        body: { keys },
      }),
      invalidatesTags: ['GeometrieActiveShapes'],
    }),
  }),
});

export const {
  useStartGeometrieSessionMutation,
  useRecordGeometrieAnswerMutation,
  useCompleteGeometrieSessionMutation,
  useGetGeometrieProgressionQuery,
  useResetGeometrieProgressionMutation,
  useGetGeometrieShapesQuery,
  useGetGeometrieActiveShapesQuery,
  useUpdateGeometrieActiveShapesMutation,
} = geometrieApi;
