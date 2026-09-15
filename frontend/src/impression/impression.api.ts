import { sharedApi } from 'src/store/api/sharedApi.ts';
import type { ItemImprime, LigneComposition } from './impression.types';

export const impressionApi = sharedApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Compose une feuille. Une mutation et non une requete : deux appels identiques
     * doivent rendre deux feuilles DIFFERENTES, donc rien ne doit etre mis en cache. */
    composerFeuille: builder.mutation<ItemImprime[], LigneComposition[]>({
      query: (lignes) => ({ url: '/impression/feuille', method: 'POST', body: { lignes } }),
    }),
  }),
});

export const { useComposerFeuilleMutation } = impressionApi;
