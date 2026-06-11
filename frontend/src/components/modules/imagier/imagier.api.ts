import type { ProgressionStat } from 'src/modules.types';
import { baseApi } from 'src/store/api/baseApi';

/** Endpoints RTK Query propres au module Imagier (co-localisés avec le module). */
export const imagierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getImagierProgression: builder.query<ProgressionStat[], void>({
      query: () => '/imagier/progression',
      // L'API Imagier renvoie les mots + leur progression (ou null) → on normalise ici.
      transformResponse: (rows: { progression: ProgressionStat | null }[]) =>
        rows.filter((row) => row.progression !== null).map((row) => row.progression!),
      providesTags: [{ type: 'Progression', id: 'imagier' }],
    }),
    resetImagierProgression: builder.mutation<void, void>({
      query: () => ({ url: '/imagier/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'imagier' }],
    }),
  }),
});
