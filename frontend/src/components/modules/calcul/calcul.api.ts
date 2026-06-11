import type { ProgressionStat } from 'src/modules.types';
import { baseApi } from 'src/store/api/baseApi';

/** Endpoints RTK Query propres au module Calcul Mental (co-localisés avec le module). */
export const calculApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCalculProgression: builder.query<ProgressionStat[], void>({
      query: () => '/calcul/progression',
      providesTags: [{ type: 'Progression', id: 'calcul' }],
    }),
    resetCalculProgression: builder.mutation<void, void>({
      query: () => ({ url: '/calcul/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'calcul' }],
    }),
  }),
});
