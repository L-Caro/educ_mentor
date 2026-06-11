import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AppModule, Setting } from 'src/types';
import type { ProgressionStat } from 'src/modules.types';

/**
 * Source unique des données serveur *cacheables* (settings, catalogue) : un seul
 * fetch partagé, mis en cache, avec invalidation. Les appels impératifs du flux de
 * jeu (sessions, réponses, uploads) restent sur l'axios `client.ts`.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: { token: string | null } }).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Settings', 'Catalog', 'ImagierCategories', 'Progression'],
  endpoints: (builder) => ({
    getSettings: builder.query<Record<string, string>, void>({
      query: () => '/settings',
      transformResponse: (rows: Setting[]) =>
        Object.fromEntries(rows.map((setting) => [setting.key, setting.value])),
      providesTags: ['Settings'],
    }),
    updateSetting: builder.mutation<Setting, { key: string; value: string }>({
      query: ({ key, value }) => ({ url: `/settings/${key}`, method: 'PATCH', body: { value } }),
      invalidatesTags: ['Settings'],
    }),
    getModules: builder.query<AppModule[], { onlyActive?: boolean } | void>({
      query: (arg) => ({
        url: '/catalog/modules',
        params: arg && arg.onlyActive ? { active: 'true' } : {},
      }),
      providesTags: ['Catalog'],
    }),
    updateModule: builder.mutation<
      AppModule,
      { id: string; payload: { is_active?: boolean; display_order?: number } }
    >({
      query: ({ id, payload }) => ({ url: `/catalog/modules/${id}`, method: 'PATCH', body: payload }),
      invalidatesTags: ['Catalog'],
    }),
    getImagierCategories: builder.query<
      { category: string; count: number; active_count: number }[],
      void
    >({
      query: () => '/imagier/categories',
      providesTags: ['ImagierCategories'],
    }),

    // ─── Progression par module (normalisée → ProgressionStat[]) ──────────────
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

    getTablesProgression: builder.query<ProgressionStat[], void>({
      query: () => '/tables/progression',
      providesTags: [{ type: 'Progression', id: 'tables' }],
    }),
    resetTablesProgression: builder.mutation<void, void>({
      query: () => ({ url: '/tables/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'tables' }],
    }),

    getCalculProgression: builder.query<ProgressionStat[], void>({
      query: () => '/calcul/progression',
      providesTags: [{ type: 'Progression', id: 'calcul' }],
    }),
    resetCalculProgression: builder.mutation<void, void>({
      query: () => ({ url: '/calcul/progression', method: 'DELETE' }),
      invalidatesTags: [{ type: 'Progression', id: 'calcul' }],
    }),

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

export const {
  useGetSettingsQuery,
  useUpdateSettingMutation,
  useGetModulesQuery,
  useUpdateModuleMutation,
} = api;
