import { baseApi } from 'src/store/api/baseApi';

export interface EtatParcours {
  parcours: string;
  etape_atteinte: number;
  niveaux_reussis: number;
}

export const programmationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProgrammationEtat: builder.query<EtatParcours[], void>({
      query: () => '/programmation/etat',
      providesTags: [{ type: 'Progression', id: 'programmation' }],
    }),
    enregistrerReussite: builder.mutation<
      EtatParcours,
      { parcours: string; etape: number }
    >({
      query: (body) => ({
        url: '/programmation/reussite',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Progression', id: 'programmation' }],
    }),
  }),
});

export const {
  useGetProgrammationEtatQuery,
  useEnregistrerReussiteMutation,
} = programmationApi;
