import store from 'src/store';
import { calculApi } from './calcul.api';
import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';

export const calculImpression: FournisseurImpression = {
  label: 'Calcul mental',
  exercices: [
    {
      cle: 'operation',
      label: 'Opérations (addition, soustraction, doubles, compléments…)',
      // L'enonce du module est deja une phrase prete : « 24 + 17 », « 37 pour aller a
      // 100 ». On l'imprime tel quel plutot que de le reconstruire, pour que le papier
      // dise exactement ce que dit l'ecran.
      enonce: (d) => (
        <span>
          {String(d.operation)} = <Blanc />
        </span>
      ),
      reponse: (d) => `${String(d.operation)} = ${String(d.reponse)}`,
      options: [
        {
          cle: 'types',
          label: 'Quelles opérations',
          type: 'multi',
          // Les types OUVERTS, pas le catalogue complet : imprimer une operation fermee
          // contournerait le seul reglage qui decide de ce que l'enfant voit.
          charger: async () => {
            const types = await store
              .dispatch(calculApi.endpoints.getCalculTypes.initiate(undefined))
              .unwrap();
            return types.map((type) => ({ valeur: type.key, label: type.label }));
          },
        },
      ],
    },
  ],
};
