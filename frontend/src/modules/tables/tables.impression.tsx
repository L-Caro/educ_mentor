import {
  Decomposition,
  FacteurManquant,
  Produit,
  Suite,
  TableComplete,
} from './TablesImprimees';
import TableauPythagore from './TableauPythagore';
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
    {
      // N'existe que sur le papier : a l'ecran il faudrait cent champs de saisie.
      cle: 'pythagore',
      label: 'Table de Pythagore à trous',
      largeur: 'pleine',
      enonce: (d) => (
        <div>
          <p className="Feuille__consigne">Complète les cases vides.</p>
          <TableauPythagore d={d} />
        </div>
      ),
      // La grille REMPLIE plutot qu'une liste de produits : une trentaine de « 7x8=56 »
      // a la file ne se relit pas, alors qu'on corrige une grille en la superposant du
      // regard a celle qu'on vient de remplir.
      reponse: (d) => <TableauPythagore d={d} memo />,
    },
  ],
  options: [
    {
      cle: 'jusqua',
      label: 'La table de Pythagore va jusqu’à',
      type: 'nombre',
      pour: ['pythagore'],
      min: 5,
      max: 12,
      defaut: 10,
    },
    {
      cle: 'trous',
      label: 'Les cases à trouer',
      type: 'grille',
      pour: ['pythagore'],
      cote: (valeurs) => Number(valeurs.jusqua ?? 10),
      contenu: (ligne, colonne) => String(ligne * colonne),
    },
    {
      cle: 'combien',
      label: 'Combien de trous, quand aucune case n’est choisie',
      type: 'nombre',
      pour: ['pythagore'],
      min: 1,
      max: 60,
      defaut: 15,
    },
    {
      cle: 'tables',
      label: 'Quelles tables',
      type: 'multi',
      // La table de Pythagore les contient TOUTES par construction : ce reglage n'a rien
      // a y dire.
      pour: [
        'produit',
        'facteur_manquant',
        'decomposition',
        'suite',
        'table_complete',
        'table_memo',
      ],
      // Statique, et pour longtemps : les tables vont de 0 a 10.
      choix: Array.from({ length: 11 }, (_, n) => ({
        valeur: String(n),
        label: `× ${n}`,
      })),
    },
  ],
};
