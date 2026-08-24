import './numeration.scss';

import { POSITION_NAME, POSITION_ORDER } from './numeration.constants';
import type { PositionKey } from './numeration.type';

/** Abréviations de rang, telles qu'elles s'écrivent au tableau. Elles se répètent d'une
 * classe à l'autre (c, d, u), d'où la ligne de classes au-dessus : sans elle, « c d u c d u »
 * est illisible. */
const ABBR: Record<PositionKey, string> = { cm: 'c', dm: 'd', m: 'u', c: 'c', d: 'd', u: 'u' };

/** Classe d'appartenance de chaque rang. */
const CLASSE: Record<PositionKey, 'milliers' | 'unités'> = {
  cm: 'milliers', dm: 'milliers', m: 'milliers',
  c: 'unités', d: 'unités', u: 'unités',
};

interface Props {
  nombre: number;
  /** Le rang cherché, mis en avant. */
  rang: PositionKey;
}

/**
 * Le tableau de numération, tel qu'il est utilisé en classe : les chiffres rangés sous le
 * nom de leur rang, groupés par classe.
 *
 * Il répond à la question posée (« quel est le chiffre des centaines ? ») en la rendant
 * VISIBLE plutôt qu'en la reformulant. C'est ce que l'ancienne fiche ne faisait pas : elle
 * recopiait l'énoncé dans un encart monospace, qui débordait.
 */
export default function NumerationRangs({ nombre, rang }: Props) {
  const chiffres = String(nombre).split('');
  const rangs = POSITION_ORDER.slice(POSITION_ORDER.length - chiffres.length);

  // Regroupement par classe, dans l'ordre d'affichage.
  const classes: { nom: string; largeur: number }[] = [];
  for (const r of rangs) {
    const nom = CLASSE[r];
    const derniere = classes.at(-1);
    if (derniere?.nom === nom) derniere.largeur++;
    else classes.push({ nom, largeur: 1 });
  }

  return (
    <table className="NumerationRangs">
      <caption>chiffre des {POSITION_NAME[rang]}</caption>
      <thead>
        <tr className="NumerationRangs__classes">
          {classes.map((c) => (
            <th key={c.nom} scope="colgroup" colSpan={c.largeur}>{c.nom}</th>
          ))}
        </tr>
        <tr>
          {rangs.map((r) => (
            <th
              key={r}
              scope="col"
              className={r === rang ? 'NumerationRangs__cell--active' : undefined}
            >
              {ABBR[r]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {rangs.map((r, i) => (
            <td key={r} className={r === rang ? 'NumerationRangs__cell--active' : undefined}>
              {chiffres[i]}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
