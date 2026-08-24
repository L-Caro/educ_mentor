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

/** Le pronom tel qu'il s'écrit devant cette forme : « j' » devant voyelle, « je » sinon.
 * Les deux colonnes restent alignées dans tous les cas. */
function pronounLabel(label: string, pronoun: Pronom, forms: Record<Pronom, string>): string {
  if (pronoun !== 'je') return label;
  return applyElision('je', forms.je).startsWith("j'") ? "j'" : 'je';
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
            <th scope="row">{pronounLabel(label, pronoun, forms)}</th>
            <td>{forms[pronoun]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
