import { useEffect, useRef } from 'react';
import type { GameAnswerState } from 'src/hooks/useGameSession';
import type { PoseQuestion } from './pose.type';
import { colonnesFausses, decode, encode, type PoseSaisie } from './poseValue';

interface Props {
  question: PoseQuestion;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  answerState: GameAnswerState;
}

/** Colonnes affichées de GAUCHE à droite, alors que tout est indexé depuis la droite. */
function indices(columns: number): number[] {
  return Array.from({ length: columns }, (_, i) => columns - 1 - i);
}

const SIGNE = { addition: '+', soustraction: '−' } as const;

/**
 * La grille d'une opération posée, telle qu'on l'écrit sur un cahier.
 *
 *      [ ] [ ] [ ] [17]   ← retenues du haut
 *        2   8   4   7
 *    −     1   3   8
 *      [ ] [ ] [4] [ ]    ← retenues du bas (compensation uniquement)
 *      ─────────────────
 *      [ ] [ ] [ ] [ ]    ← résultat
 *
 * La saisie avance de DROITE À GAUCHE, comme on calcule. Les rangées de retenue
 * n'apparaissent que si la difficulté et la méthode les prévoient : la compensation écrit
 * en bas, le cassage jamais.
 */
export default function PoseGrid({ question, value, onChange, onSubmit, answerState }: Props) {
  const saisie = decode(value, question);
  const verrouille = answerState !== 'idle';
  const cols = indices(question.columns);

  const fausses = verrouille ? colonnesFausses(question, saisie) : [];

  // Focus sur les unités à chaque nouvelle question : c'est par là qu'on commence.
  const premierRef = useRef<HTMLInputElement>(null);
  const identiteQuestion = `${question.skill_key}|${question.operands.join('-')}`;
  useEffect(() => {
    premierRef.current?.focus();
  }, [identiteQuestion]);

  function ecrire(rangee: keyof PoseSaisie, colonne: number, brut: string) {
    if (verrouille) return;
    const chiffres = brut.replace(/\D/g, '');
    const suivant: PoseSaisie = {
      ...saisie,
      [rangee]: saisie[rangee].map((v, i) =>
        i === colonne ? chiffres.slice(-(rangee === 'resultat' ? 1 : 2)) : v,
      ),
    };
    onChange(encode(suivant));
  }

  const chiffresDe = (n: number) => {
    const s = String(n).split('').reverse();
    return cols.map((c) => s[c] ?? '');
  };

  const montrerHaut = question.carry_display !== 'hidden';
  const montrerBas =
    question.carry_display !== 'hidden' && question.retenues.bas.some((v) => v !== null);

  return (
    <div
      className="PoseGrid"
      style={{ '--pose-cols': question.columns } as React.CSSProperties}
      role="group"
      aria-label={`${question.operands[0]} ${SIGNE[question.operation]} ${question.operands[1]}`}
    >
      {montrerHaut && (
        <Rangee
          nom="haut"
          cols={cols}
          rendu={(c) => (
            <Case
              key={c}
              rangee="haut"
              colonne={c}
              valeur={saisie.haut[c] ?? ''}
              attendue={question.retenues.haut[c]}
              lecture={question.carry_display === 'filled'}
              verrouille={verrouille}
              onChange={ecrire}
              onSubmit={onSubmit}
            />
          )}
        />
      )}

      <div className="PoseGrid__row PoseGrid__row--operand">
        {chiffresDe(question.operands[0]).map((d, i) => (
          <span key={cols[i]} className="PoseGrid__digit">{d}</span>
        ))}
      </div>

      <div className="PoseGrid__row PoseGrid__row--operand">
        <span className="PoseGrid__sign" aria-hidden="true">{SIGNE[question.operation]}</span>
        {chiffresDe(question.operands[1]).map((d, i) => (
          <span key={cols[i]} className="PoseGrid__digit">{d}</span>
        ))}
      </div>

      {montrerBas && (
        <Rangee
          nom="bas"
          cols={cols}
          rendu={(c) => (
            <Case
              key={c}
              rangee="bas"
              colonne={c}
              valeur={saisie.bas[c] ?? ''}
              attendue={question.retenues.bas[c]}
              lecture={question.carry_display === 'filled'}
              verrouille={verrouille}
              onChange={ecrire}
              onSubmit={onSubmit}
            />
          )}
        />
      )}

      <div className="PoseGrid__bar" aria-hidden="true" />

      <div className="PoseGrid__row PoseGrid__row--result">
        {cols.map((c) => {
          // Toutes les cases se ressemblent. En griser celles que la réponse n'utilise pas
          // reviendrait à annoncer le nombre de chiffres attendu : la case vide EST une
          // réponse possible, et c'est à l'enfant de décider où son nombre s'arrête.
          return (
            <input
              key={c}
              ref={c === 0 ? premierRef : undefined}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              autoComplete="off"
              aria-label={`résultat, colonne ${c + 1} en partant de la droite`}
              className={[
                'PoseGrid__cell',
                'PoseGrid__cell--result',
                fausses.includes(c) ? 'PoseGrid__cell--wrong' : '',
                verrouille && !fausses.includes(c) ? 'PoseGrid__cell--right' : '',
              ].filter(Boolean).join(' ')}
              value={saisie.resultat[c] ?? ''}
              readOnly={verrouille}
              onChange={(e) => ecrire('resultat', c, e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            />
          );
        })}
      </div>
    </div>
  );
}

function Rangee({
  nom,
  cols,
  rendu,
}: {
  nom: string;
  cols: number[];
  rendu: (colonne: number) => React.ReactNode;
}) {
  return <div className={`PoseGrid__row PoseGrid__row--carry-${nom}`}>{cols.map(rendu)}</div>;
}

function Case({
  rangee,
  colonne,
  valeur,
  attendue,
  lecture,
  verrouille,
  onChange,
  onSubmit,
}: {
  rangee: 'haut' | 'bas';
  colonne: number;
  valeur: string;
  attendue: number | null;
  lecture: boolean;
  verrouille: boolean;
  onChange: (rangee: 'haut' | 'bas', colonne: number, brut: string) => void;
  onSubmit: () => void;
}) {
  // Une case n'existe que là où une retenue est attendue : ailleurs, un trou visuel
  // vaut mieux qu'une case qui invite à écrire n'importe quoi.
  if (attendue === null) return <span className="PoseGrid__cell PoseGrid__cell--none" />;

  if (lecture) {
    return <span className="PoseGrid__cell PoseGrid__cell--carry PoseGrid__cell--shown">{attendue}</span>;
  }

  return (
    <input
      type="tel"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      autoComplete="off"
      aria-label={`retenue ${rangee}, colonne ${colonne + 1} en partant de la droite`}
      className="PoseGrid__cell PoseGrid__cell--carry"
      value={valeur}
      readOnly={verrouille}
      onChange={(e) => onChange(rangee, colonne, e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
    />
  );
}
