import './tables.scss';

interface Props {
  /** La table récitée : celle du plus petit facteur, plus facile à mémoriser. */
  table: number;
  /** Le multiplicateur de la question, mis en avant dans la liste. */
  highlight: number;
}

/** La table du facteur, avec la ligne cherchée mise en avant.
 * On récite jusqu'à 10 : c'est la table telle qu'elle est apprise. */
export default function TableRappel({ table, highlight }: Props) {
  return (
    <table className="TableRappel">
      <tbody>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <tr key={n} className={n === highlight ? 'TableRappel__row--active' : undefined}>
            <th scope="row">{table} × {n}</th>
            <td>{table * n}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
