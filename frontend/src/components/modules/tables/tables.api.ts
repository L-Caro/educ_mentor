import type { ProgressionStat } from 'src/modules.types';
import { baseApi } from 'src/store/api/baseApi';

/** Endpoints RTK Query propres au module Tables (co-localisés avec le module). */
export const tablesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTablesProgression: builder.query<ProgressionStat[], void>({
      query: () => '/tables/progression',
      providesTags: [{ type: 'Progression', id: 'tables' }],
    }),
    resetTablesProgression: builder.mutation<void, void>({
      query: () => ({ url: '/tables/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'tables' }],
    }),
  }),
});
