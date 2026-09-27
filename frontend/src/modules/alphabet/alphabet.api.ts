import { baseApi } from 'src/store/api/baseApi';
import type {
  AlphabetSession,
  EtatReferentiel,
  MotTrouve,
} from './alphabet.types';

export const alphabetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    startAlphabetSession: builder.mutation<
      AlphabetSession,
      { types?: string[]; communes?: number; combien?: number }
    >({
      query: (body) => ({ url: '/alphabet/session', method: 'POST', body }),
    }),

    getAlphabetEtat: builder.query<EtatReferentiel, void>({
      query: () => '/alphabet/etat',
      providesTags: ['AlphabetExclus'],
    }),
    // La recherche n'est PAS mise en cache par terme : on tape lettre a lettre, et
    // garder chaque frappe encombrerait le magasin pour des resultats qu'on ne revoit
    // jamais.
    chercherMots: builder.query<MotTrouve[], string>({
      query: (terme) => `/alphabet/chercher?terme=${encodeURIComponent(terme)}`,
      providesTags: ['AlphabetExclus'],
    }),
    getMotsExclus: builder.query<{ mot: string; exclu_le: string }[], void>({
      query: () => '/alphabet/exclus',
      providesTags: ['AlphabetExclus'],
    }),
    exclureMot: builder.mutation<{ exclus: number }, string>({
      query: (mot) => ({
        url: '/alphabet/exclus',
        method: 'POST',
        body: { mot },
      }),
      invalidatesTags: ['AlphabetExclus'],
    }),
    reintegrerMot: builder.mutation<{ exclus: number }, string>({
      query: (mot) => ({
        url: '/alphabet/exclus',
        method: 'DELETE',
        body: { mot },
      }),
      invalidatesTags: ['AlphabetExclus'],
    }),
  }),
});

export const {
  useStartAlphabetSessionMutation,
  useGetAlphabetEtatQuery,
  useLazyChercherMotsQuery,
  useGetMotsExclusQuery,
  useExclureMotMutation,
  useReintegrerMotMutation,
} = alphabetApi;
