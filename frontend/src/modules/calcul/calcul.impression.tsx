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
    },
  ],
};
