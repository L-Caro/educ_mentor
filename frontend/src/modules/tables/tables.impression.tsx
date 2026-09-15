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
      options: [
        {
          cle: 'tables',
          label: 'Quelles tables',
          type: 'multi',
          // Statique, et pour longtemps : les tables vont de 0 a 10.
          choix: Array.from({ length: 11 }, (_, n) => ({
            valeur: String(n),
            label: `× ${n}`,
          })),
        },
      ],
    },
  ],
};
