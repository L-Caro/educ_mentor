import type { PoseQuestion } from './pose.type';
import { colonnesBarrees } from './poseValue';
import './pose.scss';

const SIGNE = { addition: '+', soustraction: '−', multiplication: '×' } as const;

/**
 * L'opération posée, en lecture seule, telle qu'elle s'écrit : colonnes alignées, retenues
 * à leur place, trait avant le résultat.
 *
 * Rendue en grille CSS et non en caractères. Une version en texte monospace obligeait à
 * compter les espaces à la main — c'était faux — et le trait dessiné en caractères de
 * remplissage se lisait comme un cadratin. Ici l'alignement vient de la grille et le trait
 * d'une bordure.
 */
export default function PoseFigure({ question }: { question: PoseQuestion }) {
  const cols = Array.from({ length: question.columns }, (_, i) => question.columns - 1 - i);
  const chiffres = (n: number) => {
    const s = String(n).split('').reverse();
    return cols.map((c) => s[c] ?? '');
  };
  const barrees = colonnesBarrees(question);

  // La rangée du bas est toujours rendue, même vide : la figure doit occuper un nombre
  // ENTIER d'interlignes pour que le texte qui la suit retombe sur la réglure.

  return (
    <div className="PoseFigure" style={{ '--pose-cols': question.columns } as React.CSSProperties}>
      <div className="PoseFigure__row PoseFigure__row--carry">
        {cols.map((c) => (
          <span key={c} className="PoseFigure__carry">{question.retenues.haut[c] ?? ''}</span>
        ))}
      </div>

      <div className="PoseFigure__row">
        {chiffres(question.operands[0]).map((d, i) => (
          <span
            key={cols[i]}
            className={`PoseFigure__digit${barrees.includes(cols[i]) && d !== '' ? ' PoseFigure__digit--barre' : ''}`}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="PoseFigure__row">
        <span className="PoseFigure__sign" aria-hidden="true">{SIGNE[question.operation]}</span>
        {chiffres(question.operands[1]).map((d, i) => (
          <span key={cols[i]} className="PoseFigure__digit">{d}</span>
        ))}
      </div>

      <div className="PoseFigure__row PoseFigure__row--carry">
        {cols.map((c) => (
          <span key={c} className="PoseFigure__carry">{question.retenues.bas[c] ?? ''}</span>
        ))}
      </div>

      <div className="PoseFigure__row PoseFigure__row--result">
        {chiffres(question.answer).map((d, i) => (
          <span key={cols[i]} className="PoseFigure__digit">{d}</span>
        ))}
      </div>
    </div>
  );
}
