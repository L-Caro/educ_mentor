import { useState } from 'react';
import type { GameAnswerState } from 'src/hooks/useGameSession';
import type { CompteQuestion, Etape, Operation } from './compte.type';
import { appliquer, decode, disponibles, ecrireEtape, encode } from './compteValue';

interface Props {
  question: CompteQuestion;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  answerState: GameAnswerState;
}

/**
 * Le plateau du compte est bon, joué UNE ÉTAPE À LA FOIS.
 *
 *      Cible : 348
 *
 *      [100] [75] [8] [4] [3] [2]        ← les plaques encore en jeu
 *            +   −   ×   ÷               ← les opérations ouvertes
 *
 *      100 × 3 = 300                     ← les étapes déjà posées
 *      300 + 48 = 348
 *
 * Pourquoi pas un champ où elle écrirait « 100×3+8×6 » : parce qu'une expression est une
 * autre compétence, et qu'elle cache l'essentiel du jeu. Ce qui s'apprend ici, c'est de
 * regarder les nombres dont on dispose et d'en fabriquer un nouveau. Poser une étape,
 * voir la plaque apparaître et les deux autres disparaître, c'est exactement le geste du
 * jeu de plateau, et ça rend impossible d'employer deux fois la même plaque, faute
 * numéro un quand on écrit une expression à la main.
 *
 * L'enchaînement est strict : une plaque, une opération, une plaque. Un opérateur seul
 * ne veut rien dire, et devoir le choisir après avoir vu son premier nombre pousse à
 * chercher plutôt qu'à essayer au hasard.
 */
export default function ComptePlateau(props: Props) {
  // La sélection en cours appartient AU TIRAGE, pas au module : une plaque choisie n'a
  // aucun sens sur le tirage suivant. La clé le dit à React, qui remonte le plateau à
  // chaque question, et une remise à zéro par `useEffect` deviendrait inutile.
  //
  // Le composant exporté, lui, reste une référence stable : c'est ce que le moteur exige
  // d'un `inputComponent`, sans quoi il démonterait la saisie à chaque frappe.
  return <Plateau key={props.question.item_key} {...props} />;
}

function Plateau({ question, value, onChange, answerState }: Props) {
  const etapes = decode(value);
  const enJeu = disponibles(question.plaques, etapes);
  const fige = answerState !== 'idle';

  /** L'étape en cours de composition : l'index de la première plaque dans `enJeu`, puis
   *  l'opération. Un index et non la valeur : deux plaques peuvent porter le même
   *  nombre, et il faut savoir laquelle est prise. */
  const [premier, setPremier] = useState<number | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [refus, setRefus] = useState<string | null>(null);

  function choisirPlaque(index: number) {
    if (fige) return;
    setRefus(null);

    if (premier === null) {
      setPremier(index);
      return;
    }
    if (index === premier) {
      // Retaper la plaque choisie la relâche : c'est le seul moyen de se corriger avant
      // d'avoir posé l'opération.
      setPremier(null);
      setOperation(null);
      return;
    }
    if (operation === null) {
      setPremier(index);
      return;
    }

    const a = enJeu[premier].nombre;
    const b = enJeu[index].nombre;
    const resultat = appliquer(a, operation, b);
    if (resultat === null) {
      setRefus(pourquoiRefusee(a, operation, b));
      setOperation(null);
      return;
    }

    const etape: Etape = { a, operation, b, resultat };
    onChange(encode([...etapes, etape]));
    setPremier(null);
    setOperation(null);
  }

  function annulerDerniere() {
    if (fige || etapes.length === 0) return;
    onChange(encode(etapes.slice(0, -1)));
    setPremier(null);
    setOperation(null);
    setRefus(null);
  }

  function toutReprendre() {
    if (fige) return;
    onChange(encode([]));
    setPremier(null);
    setOperation(null);
    setRefus(null);
  }

  const attendSecondeplaque = premier !== null && operation !== null;

  return (
    <div className="ComptePlateau">
      <p className="ComptePlateau__cible">
        <span className="ComptePlateau__cibleLabel">Cible</span>
        <span className="ComptePlateau__cibleValeur">{question.cible}</span>
      </p>

      <div className="ComptePlateau__plaques">
        {enJeu.map((plaque, index) => {
          const classes = [
            'ComptePlateau__plaque',
            premier === index ? 'ComptePlateau__plaque--choisie' : '',
            plaque.obtenue ? 'ComptePlateau__plaque--obtenue' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <button
              key={`${plaque.nombre}-${index}`}
              type="button"
              className={classes}
              onClick={() => choisirPlaque(index)}
              disabled={fige}
              aria-pressed={premier === index}
            >
              {plaque.nombre}
            </button>
          );
        })}
      </div>

      <div className="ComptePlateau__operations">
        {question.operations.map((op) => (
          <button
            key={op}
            type="button"
            className={`ComptePlateau__operation${
              operation === op ? ' ComptePlateau__operation--choisie' : ''
            }`}
            // Une opération avant d'avoir choisi un premier nombre ne veut rien dire.
            disabled={fige || premier === null}
            onClick={() => {
              setOperation(op);
              setRefus(null);
            }}
            aria-pressed={operation === op}
          >
            {op === '-' ? '−' : op}
          </button>
        ))}
      </div>

      <p className="ComptePlateau__consigne" role="status">
        {refus
          ? refus
          : attendSecondeplaque
            ? `${enJeu[premier].nombre} ${operation === '-' ? '−' : operation} … choisis la seconde plaque`
            : premier !== null
              ? `${enJeu[premier].nombre} … choisis une opération`
              : 'Choisis une plaque'}
      </p>

      {etapes.length > 0 && (
        <>
          <ol className="ComptePlateau__etapes">
            {etapes.map((etape, index) => (
              <li key={index} className="ComptePlateau__etape">
                {ecrireEtape(etape)}
              </li>
            ))}
          </ol>

          <div className="ComptePlateau__reprises">
            <button
              type="button"
              className="ComptePlateau__reprise"
              onClick={annulerDerniere}
              disabled={fige}
            >
              ↩ Annuler la dernière
            </button>
            <button
              type="button"
              className="ComptePlateau__reprise"
              onClick={toutReprendre}
              disabled={fige}
            >
              ⟲ Tout reprendre
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** Dire POURQUOI un coup est refusé, jamais seulement qu'il l'est.
 *
 * « 3 − 8 » et « 7 ÷ 2 » sont refusés pour deux raisons différentes, et les deux sont des
 * choses à apprendre. Un message unique, « coup impossible », les rendrait toutes les
 * deux mystérieuses. */
function pourquoiRefusee(a: number, operation: Operation, b: number): string {
  if (operation === '-') {
    return `${a} − ${b} passerait sous zéro : il n'y a pas de plaque négative.`;
  }
  if (operation === '÷' && b === 0) {
    return 'On ne divise pas par zéro.';
  }
  return `${a} ÷ ${b} ne tombe pas juste : il n'y a pas de plaque à virgule.`;
}
