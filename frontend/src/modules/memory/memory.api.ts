import type { ProgressionStat } from 'src/types/modules.types.ts';
import type { MemorySessionResponse, MemoryMode } from './memory.type.ts';
import { baseApi } from 'src/store/api/baseApi.ts';

export const memoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startMemorySession: builder.mutation<
      MemorySessionResponse,
      { pairs_count: number; mode: MemoryMode; categories?: string[] }
    >({
      query: (body) => ({ url: '/memory/session', method: 'POST', body }),
    }),

    completeMemorySession: builder.mutation<
      void,
      { sessionId: string; attempts: number }
    >({
      query: ({ sessionId, attempts }) => ({
        url: `/memory/session/${sessionId}/complete`,
        method: 'POST',
        body: { attempts },
      }),
      invalidatesTags: [{ type: 'Progression', id: 'memory' }],
    }),

    getMemoryProgression: builder.query<ProgressionStat[], void>({
      query: () => '/memory/progression',
      providesTags: [{ type: 'Progression', id: 'memory' }],
    }),

    resetMemoryProgression: builder.mutation<void, void>({
      query: () => ({ url: '/memory/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'memory' }],
    }),
  }),
});

export const {
  useStartMemorySessionMutation,
  useCompleteMemorySessionMutation,
  useGetMemoryProgressionQuery,
  useResetMemoryProgressionMutation,
} = memoryApi;