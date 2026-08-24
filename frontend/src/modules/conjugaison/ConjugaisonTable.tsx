import type { Pronom } from './conjugaison.type';
import { applyElision } from './elision';

/** Ordre de conjugaison, celui du tableau qu'on récite. Les formes de 3ᵉ personne
 * partagent une ligne : « il, elle, on » et « ils, elles » se conjuguent pareil. */
const ROWS: { label: string; pronoun: Pronom }[] = [
  { label: 'je',            pronoun: 'je' },
  { label: 'tu',            pronoun: 'tu' },
  { label: 'il, elle, on',  pronoun: 'il' },
  { label: 'nous',          pronoun: 'nous' },
  { label: 'vous',          pronoun: 'vous' },
  { label: 'ils, elles',    pronoun: 'ils' },
];

/** Le pronom de la question peut être une variante de la ligne affichée
 * (« elle » et « on » vivent sur la ligne « il »). */
const ROW_OF: Partial<Record<Pronom, Pronom>> = { elle: 'il', on: 'il', elles: 'ils' };

/**
 * Découpe une ligne en deux cellules. L'élision fait exception : « j'ai » ne se coupe pas
 * en « j' » + « ai », on la garde d'un bloc et la colonne des pronoms reste vide. Les
 * verbes sans élision (« je chante ») conservent les deux colonnes alignées.
 */
function cellsFor(label: string, pronoun: Pronom, forms: Record<Pronom, string>) {
  if (pronoun !== 'je') return { label, form: forms[pronoun] };

  const elided = applyElision('je', forms.je);
  return elided.startsWith("j'")
    ? { label: '', form: elided }
    : { label, form: forms.je };
}

interface Props {
  forms: Record<Pronom, string>;
  /** Ligne mise en avant : celle sur laquelle portait la question. */
  highlight?: Pronom;
}

export default function ConjugaisonTable({ forms, highlight }: Props) {
  const active = highlight ? ROW_OF[highlight] ?? highlight : undefined;

  return (
    <table className="ConjugaisonTable">
      <tbody>
        {ROWS.map(({ label, pronoun }) => (
          <tr
            key={pronoun}
            className={pronoun === active ? 'ConjugaisonTable__row--active' : undefined}
          >
            <th scope="row">{cellsFor(label, pronoun, forms).label}</th>
            <td>{cellsFor(label, pronoun, forms).form}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
