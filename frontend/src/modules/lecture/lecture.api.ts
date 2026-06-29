import type { ProgressionStat } from 'src/types/modules.types';
import { baseApi } from 'src/store/api/baseApi';
import type {
  LectureAdminQuestion,
  LectureAdminText,
  LectureSessionResponse,
  LectureTextSummary,
} from './lecture.type';

export const lectureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Jeu ────────────────────────────────────────────────────────────────

    getActiveTexts: builder.query<LectureTextSummary[], void>({
      query: () => '/lecture/texts',
      providesTags: ['LectureTexts'],
    }),

    startLectureSession: builder.mutation<LectureSessionResponse, { textId: number; difficulty?: string }>({
      query: (body) => ({ url: '/lecture/session', method: 'POST', body }),
    }),

    recordLectureAnswer: builder.mutation<void, { sessionId: string; itemKey: string; isCorrect: boolean }>({
      query: ({ sessionId, ...body }) => ({ url: `/lecture/session/${sessionId}/answer`, method: 'POST', body }),
    }),

    completeLectureSession: builder.mutation<void, { sessionId: string; correctAnswers: number; totalQuestions: number }>({
      query: ({ sessionId, ...body }) => ({ url: `/lecture/session/${sessionId}/complete`, method: 'POST', body }),
      invalidatesTags: ['LectureTexts', { type: 'Progression', id: 'lecture' }],
    }),

    // ─── Admin — textes ─────────────────────────────────────────────────────

    getAdminTexts: builder.query<LectureAdminText[], void>({
      query: () => '/admin/lecture/texts',
      providesTags: ['LectureAdminTexts'],
    }),

    createText: builder.mutation<LectureAdminText, { titre: string; contenu: string; actif?: boolean }>({
      query: (body) => ({ url: '/admin/lecture/texts', method: 'POST', body }),
      invalidatesTags: ['LectureAdminTexts', 'LectureTexts'],
    }),

    updateText: builder.mutation<LectureAdminText, { id: number; titre?: string; contenu?: string; actif?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/lecture/texts/${id}`, method: 'PUT', body }),
      invalidatesTags: ['LectureAdminTexts', 'LectureTexts'],
    }),

    deleteText: builder.mutation<void, number>({
      query: (id) => ({ url: `/admin/lecture/texts/${id}`, method: 'DELETE' }),
      invalidatesTags: ['LectureAdminTexts', 'LectureTexts'],
    }),

    // ─── Admin — questions ───────────────────────────────────────────────────

    getAdminQuestions: builder.query<LectureAdminQuestion[], number>({
      query: (textId) => `/admin/lecture/texts/${textId}/questions`,
      providesTags: (_r, _e, textId) => [{ type: 'LectureQuestions' as const, id: textId }],
    }),

    createQuestion: builder.mutation<LectureAdminQuestion, { textId: number; question: string; answer: string; distractors: string[]; excerpt?: string; ordre?: number }>({
      query: ({ textId, ...body }) => ({ url: `/admin/lecture/texts/${textId}/questions`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { textId }) => [{ type: 'LectureQuestions' as const, id: textId }, 'LectureAdminTexts'],
    }),

    updateQuestion: builder.mutation<LectureAdminQuestion, { id: number; textId: number; question?: string; answer?: string; distractors?: string[]; excerpt?: string; ordre?: number }>({
      query: ({ id, textId: _textId, ...body }) => ({ url: `/admin/lecture/questions/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { textId }) => [{ type: 'LectureQuestions' as const, id: textId }],
    }),

    deleteQuestion: builder.mutation<void, { id: number; textId: number }>({
      query: ({ id }) => ({ url: `/admin/lecture/questions/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { textId }) => [{ type: 'LectureQuestions' as const, id: textId }, 'LectureAdminTexts'],
    }),

    // ─── Admin — progression ─────────────────────────────────────────────────

    getLectureProgression: builder.query<ProgressionStat[], void>({
      query: () => '/admin/lecture/progression',
      providesTags: [{ type: 'Progression', id: 'lecture' }],
    }),

    resetLectureProgression: builder.mutation<void, void>({
      query: () => ({ url: '/admin/lecture/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'lecture' }, 'LectureTexts'],
    }),
  }),
});

export const {
  useGetActiveTextsQuery,
  useStartLectureSessionMutation,
  useRecordLectureAnswerMutation,
  useCompleteLectureSessionMutation,
  useGetAdminTextsQuery,
  useCreateTextMutation,
  useUpdateTextMutation,
  useDeleteTextMutation,
  useGetAdminQuestionsQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetLectureProgressionQuery,
  useResetLectureProgressionMutation,
} = lectureApi;