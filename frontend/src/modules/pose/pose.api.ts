import { sharedApi } from 'src/store/api/sharedApi.ts';
import type { PoseSessionResponse } from './pose.type';

export const poseApi = sharedApi.injectEndpoints({
  endpoints: (builder) => ({
    startPoseSession: builder.mutation<
      PoseSessionResponse,
      { difficulty?: string; operations?: string[] }
    >({
      query: (body) => ({ url: '/pose/session', method: 'POST', body }),
    }),

    recordPoseAnswer: builder.mutation<
      void,
      { sessionId: string; skillKey: string; isCorrect: boolean }
    >({
      query: ({ sessionId, skillKey, isCorrect }) => ({
        url: `/pose/session/${sessionId}/answer`,
        method: 'POST',
        body: { skill_key: skillKey, is_correct: isCorrect },
      }),
    }),

    completePoseSession: builder.mutation<
      void,
      { sessionId: string; correctAnswers: number; totalQuestions: number }
    >({
      query: ({ sessionId, correctAnswers, totalQuestions }) => ({
        url: `/pose/session/${sessionId}/complete`,
        method: 'POST',
        body: { correct_answers: correctAnswers, total_questions: totalQuestions },
      }),
    }),

    getPoseProgression: builder.query<
      { is_mastered: boolean; correct_count: number; incorrect_count: number }[],
      void
    >({
      query: () => '/pose/progression',
    }),

    resetPoseProgression: builder.mutation<void, void>({
      query: () => ({ url: '/pose/progression', method: 'DELETE' }),
    }),
  }),
});

export const {
  useGetPoseProgressionQuery,
  useResetPoseProgressionMutation,
} = poseApi;
