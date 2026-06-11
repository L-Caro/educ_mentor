import type { ProgressionStat } from 'src/modules.types';
import { baseApi } from 'src/store/api/baseApi';

/** Endpoints RTK Query propres au module Monnaie (co-localisés avec le module). */
export const monnaieApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMonnaieProgression: builder.query<ProgressionStat[], void>({
      query: () => '/monnaie/progression',
      providesTags: [{ type: 'Progression', id: 'monnaie' }],
    }),
    resetMonnaieProgression: builder.mutation<void, void>({
      query: () => ({ url: '/monnaie/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'monnaie' }],
    }),
  }),
});
