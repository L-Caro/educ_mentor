import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';

export const tablesImpression: FournisseurImpression = {
  label: 'Tables de multiplication',
  exercices: [
    {
      cle: 'produit',
      label: 'Multiplications (7 × 8 = …)',
      enonce: (d) => (
        <span>
          {String(d.a)} × {String(d.b)} = <Blanc />
        </span>
      ),
      reponse: (d) => `${String(d.a)} × ${String(d.b)} = ${String(d.reponse)}`,
    },
  ],
};
