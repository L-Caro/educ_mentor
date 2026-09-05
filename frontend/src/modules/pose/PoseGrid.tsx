import { useEffect, useRef } from 'react';
import type { GameAnswerState } from 'src/hooks/useGameSession';
import type { PoseQuestion } from './pose.type';
import {
  colonnesBarrees,
  colonnesFausses,
  colonnesPartielFausses,
  decode,
  encode,
  lignesPartielles,
  partielAttendu,
  type PoseSaisie,
} from './poseValue';

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

const SIGNE = { addition: '+', soustraction: '−', multiplication: '×' } as const;

/**
 * La grille d'une opération posée, telle qu'on l'écrit sur un cahier.
 *
 * Par compensation, on ajoute 10 en haut et une dizaine en bas :
 *
 *      [ ] [ ] [ ] [17]   ← retenues du haut
 *        2   8   4   7
 *    −     1   3   8
 *      [ ] [ ] [4] [ ]    ← retenues du bas
 *      ─────────────────
 *      [ ] [ ] [ ] [ ]    ← résultat
 *
 * Par cassage, on emprunte au chiffre de gauche, qui est barré et réécrit diminué.
 * Rien ne s'écrit en bas, et le nombre du haut se lit dans la rangée des retenues :
 *
 *      [ ] [ ] [3] [17]
 *        2   8   4̶   7̶
 *    −     1   3   8
 *      ─────────────────
 *      [ ] [ ] [ ] [ ]
 *
 * La multiplication a sa propre géométrie : une rangée par produit partiel, décalée d'un
 * rang à chaque fois. C'est ce décalage qui fait toute la difficulté de l'opération, et
 * c'est pour ça qu'il se saisit au lieu d'être posé d'avance.
 *
 *        2   4   7
 *    ×       3   6
 *      ─────────────
 *      [ ] [ ] [ ] [ ]      ← 247 × 6
 *  [ ] [ ] [ ] ·            ← 247 × 3, décalé d'un rang
 *      ─────────────
 *      [ ] [ ] [ ] [ ]      ← la somme
 *
 * Aucune rangée de retenue en multiplication : à l'école elles s'écrivent petit et
 * s'effacent d'une ligne à l'autre, et une rangée par produit rendrait la grille illisible.
 *
 * La saisie avance de DROITE À GAUCHE, comme on calcule. Les rangées de retenue
 * n'apparaissent que si la difficulté et la méthode les prévoient.
 */
export default function PoseGrid({ question, value, onChange, onSubmit, answerState }: Props) {
  const saisie = decode(value, question);
  const verrouille = answerState !== 'idle';
  const cols = indices(question.columns);

  const fausses = verrouille ? colonnesFausses(question, saisie) : [];
  // Par cassage, le nombre du haut est démonté au fur et à mesure : les chiffres
  // remplacés sont barrés. On ne les barre que lorsque la marque est visible : sinon
  // on signalerait les colonnes à emprunter sans donner de quoi les traiter.
  const barrees = question.carry_display === 'hidden' ? [] : colonnesBarrees(question);

  // Focus sur les unités à chaque nouvelle question : c'est par là qu'on commence.
  const premierRef = useRef<HTMLInputElement>(null);
  const identiteQuestion = `${question.skill_key}|${question.operands.join('-')}`;
  useEffect(() => {
    premierRef.current?.focus();
  }, [identiteQuestion]);

  function ecrire(
    rangee: 'haut' | 'bas' | 'resultat',
    colonne: number,
    brut: string,
  ) {
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

  function ecrirePartiel(ligne: number, colonne: number, brut: string) {
    if (verrouille) return;
    const chiffre = brut.replace(/\D/g, '').slice(-1);
    const suivant: PoseSaisie = {
      ...saisie,
      partiels: saisie.partiels.map((rangee, l) =>
        l === ligne
          ? rangee.map((v, c) => (c === colonne ? chiffre : v))
          : rangee,
      ),
    };
    onChange(encode(suivant));
  }

  const chiffresDe = (n: number) => {
    const s = String(n).split('').reverse();
    return cols.map((c) => s[c] ?? '');
  };

  const partiels = lignesPartielles(question);

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
          <span
            key={cols[i]}
            className={`PoseGrid__digit${barrees.includes(cols[i]) && d !== '' ? ' PoseGrid__digit--barre' : ''}`}
          >
            {d}
          </span>
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

      {partiels.map((partiel, ligne) => {
        const attendu = partielAttendu(question, partiel);
        const fautives = verrouille
          ? colonnesPartielFausses(question, saisie, ligne)
          : [];
        return (
          <div
            key={partiel.decalage}
            className="PoseGrid__row PoseGrid__row--partiel"
          >
            {cols.map((c) => {
              // À gauche du nombre comme à droite du décalage, aucune case : un trou
              // visuel vaut mieux qu'une case qui invite à écrire n'importe quoi, et le
              // décalage doit se VOIR : c'est lui qu'on apprend.
              if (attendu[c] === '') {
                return (
                  <span
                    key={c}
                    className="PoseGrid__cell PoseGrid__cell--none"
                    aria-hidden="true"
                  />
                );
              }
              return (
                <input
                  key={c}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete="off"
                  aria-label={`produit partiel ${ligne + 1}, colonne ${c + 1} en partant de la droite`}
                  className={[
                    'PoseGrid__cell',
                    'PoseGrid__cell--partiel',
                    fautives.includes(c) ? 'PoseGrid__cell--wrong' : '',
                    verrouille && !fautives.includes(c)
                      ? 'PoseGrid__cell--right'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  value={saisie.partiels[ligne]?.[c] ?? ''}
                  readOnly={verrouille}
                  onChange={(e) => ecrirePartiel(ligne, c, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                />
              );
            })}
          </div>
        );
      })}

      {partiels.length > 0 && (
        <div className="PoseGrid__bar" aria-hidden="true" />
      )}

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
