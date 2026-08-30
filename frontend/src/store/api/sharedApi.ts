import type { AppModule, Setting } from 'src/types';
import { baseApi } from './baseApi';

/**
 * Endpoints transverses (non rattachés à un module) : réglages globaux, catalogue
 * des modules, catégories Imagier (partagées entre le pré-jeu et l'admin).
 */
export const sharedApi = baseApi.injectEndpoints({
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
      {
        category: string;
        count: number;
        active_count: number;
        subcategories: { subcategory: string; count: number; active_count: number }[];
      }[],
      void
    >({
      query: () => '/imagier/categories',
      providesTags: ['ImagierCategories'],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingMutation,
  useGetModulesQuery,
  useUpdateModuleMutation,
  useGetImagierCategoriesQuery,
} = sharedApi;
