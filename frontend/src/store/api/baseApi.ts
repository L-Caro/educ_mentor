import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * Socle RTK Query unique : une seule baseQuery, une seule injection du token.
 * Les endpoints ne sont pas déclarés ici — chaque domaine (transverse ou module)
 * les injecte via `baseApi.injectEndpoints` depuis son propre fichier, partageant
 * le même reducer et le même cache.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: { token: string | null } }).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Settings', 'Catalog', 'ImagierCategories', 'ImagierWords', 'Progression', 'Invitations', 'LectureTexts', 'LectureAdminTexts', 'LectureQuestions', 'DicteeItems', 'GeometrieActiveShapes', 'GrammaireActiveNotions', 'AccordsActiveNotions', 'ConjugaisonActiveTenses'],
  endpoints: () => ({}),
});
