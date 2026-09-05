import { sharedApi } from './sharedApi.ts';

export interface PeageQuestion {
  module_id: string;
  module_nom: string;
  consigne: string;
  enonce: string;
  choix: string[];
  reponse: string;
}

export const peageApi = sharedApi.injectEndpoints({
  endpoints: (builder) => ({
    /** L'état du péage : combien de questions, et lesquels des cinq modules peuvent en
     * fournir. Interrogé avant d'en demander une, sinon il faudrait demander une
     * question pour découvrir qu'il n'y en a pas. */
    getPeage: builder.query<{ questions: number; modules: string[] }, void>({
      query: () => '/peage',
    }),

    /** Une question, ou `null`. `null` veut dire « laisse-la jouer » : tous les modules
     * peuvent être éteints, ou toutes leurs notions fermées. */
    getPeageQuestion: builder.mutation<{ question: PeageQuestion | null }, void>({
      query: () => '/peage/question',
    }),
  }),
});

export const { useGetPeageQuery, useGetPeageQuestionMutation } = peageApi;
