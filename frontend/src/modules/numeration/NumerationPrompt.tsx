import type { NumerationQuestion } from './numeration.type';
import { formatNumbers } from 'src/utils/formatNumber';

// ─── Prompt ───────────────────────────────────────────────────────────────────

export function NumerationPrompt({ question }: { question: NumerationQuestion }) {
  if (question.type === 'comparaison') {
    const [left, , right] = question.display.split('  ');
    return (
      <div className="NumerationPrompt NumerationPrompt--comparaison">
        <span className="NumerationPrompt__number">{formatNumbers(left)}</span>
        <span className="NumerationPrompt__blank">□</span>
        <span className="NumerationPrompt__number">{formatNumbers(right)}</span>
      </div>
    );
  }

  if (question.type === 'suite') {
    const terms = question.suite_terms ?? [];
    return (
      <div className="NumerationPrompt NumerationPrompt--suite">
        {terms.map((t, i) => (
          <span key={i} className="NumerationPrompt__term">{formatNumbers(t)}</span>
        ))}
        <span className="NumerationPrompt__term NumerationPrompt__term--blank">?</span>
      </div>
    );
  }

  if (question.type === 'decomposition') {
    return (
      <div className="NumerationPrompt NumerationPrompt--decomposition">
        <p className="NumerationPrompt__label">Décompose</p>
        <span className="NumerationPrompt__bigNumber">{formatNumbers(question.display)}</span>
      </div>
    );
  }

  // valeur_positionnelle
  return (
    <div className="NumerationPrompt NumerationPrompt--valpos">
      <p className="NumerationPrompt__question">{formatNumbers(question.display)}</p>
    </div>
  );
}
