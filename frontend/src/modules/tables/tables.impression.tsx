import {
  Decomposition,
  FacteurManquant,
  Produit,
  Suite,
  TableComplete,
} from './TablesImprimees';
import type { FournisseurImpression } from 'src/impression/impression.types';

/**
 * Les cinq facons de travailler une table sur le papier.
 *
 * Les trois premieres sortent du MEME fait (`7 x 8 = 56`), seule la case laissee vide
 * change. Les deux dernieres partent de la table entiere. C'est le meme savoir vu de cinq
 * cotes, et c'est ce qui evite qu'une feuille de tables soit vingt fois la meme question.
 *
 * Les multiplications posees ne sont pas ici : elles existent deja dans le calcul pose,
 * et les ecrire deux fois donnerait deux rendus a tenir d'accord.
 */
export const tablesImpression: FournisseurImpression = {
  label: 'Tables de multiplication',
  exercices: [
    {
      cle: 'produit',
      label: '7 × 8 = …',
      enonce: (d) => <Produit d={d} />,
      reponse: (d) => `${String(d.a)} × ${String(d.b)} = ${String(d.reponse)}`,
    },
    {
      cle: 'facteur_manquant',
      label: '7 × … = 56',
      enonce: (d) => <FacteurManquant d={d} />,
      reponse: (d) => (d.cacheGauche ? String(d.a) : String(d.b)),
    },
    {
      cle: 'decomposition',
      label: '56 = … × …',
      enonce: (d) => <Decomposition d={d} />,
      // Plusieurs reponses sont justes : on donne celle du tirage en precisant qu'elle
      // n'est pas la seule, sinon l'adulte barrerait une reponse correcte.
      reponse: (d) => `${String(d.a)} × ${String(d.b)} (ou une autre paire)`,
    },
    {
      cle: 'suite',
      label: 'Suite : 7, 14, …, 28, …',
      enonce: (d) => <Suite d={d} />,
      reponse: (d) => {
        const termes = d.termes as number[];
        const trous = d.trous as number[];
        return trous.map((rang) => termes[rang]).join(' et ');
      },
    },
    {
      cle: 'table_complete',
      label: 'Table entière à remplir',
      enonce: (d) => <TableComplete d={d} memo={false} />,
      reponse: (d) => {
        const lignes = d.lignes as { produit: number }[];
        return `table de ${String(d.table)} : ${lignes.map((l) => l.produit).join(', ')}`;
      },
    },
    {
      cle: 'table_memo',
      label: 'Table entière déjà remplie (à garder)',
      enonce: (d) => <TableComplete d={d} memo />,
      // Elle est deja remplie : rien a corriger.
      reponse: () => '(memo)',
    },
  ],
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
};
