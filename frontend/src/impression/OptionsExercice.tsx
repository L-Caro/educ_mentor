import { useEffect, useState } from 'react';
import type { ChoixImprimable, OptionImprimable } from './impression.types';
import './impression.scss';

interface Props {
  options: OptionImprimable[];
  valeurs: Record<string, unknown>;
  onChange: (valeurs: Record<string, unknown>) => void;
}

/**
 * Les reglages d'un exercice, sous son compteur.
 *
 * Trois formes seulement : une liste a cocher, un choix unique, ou un nombre. C'est assez
 * pour tout ce que les modules demandent (quelles tables, quels chiffres au cadran,
 * combien de formes), et s'en tenir a trois evite que chaque module invente son propre
 * formulaire.
 *
 * Rien de coche vaut « pas de filtre » et non « rien » : c'est le comportement des
 * modules, qui tirent librement quand la liste est vide. Une case a cocher qui, decochee,
 * viderait la feuille serait un piege.
 */
export default function OptionsExercice({ options, valeurs, onChange }: Props) {
  return (
    <div className="Impression__options">
      {options.map((option) =>
        option.type === 'nombre' ? (
          <div key={option.cle} className="GameSettings__rangeRow">
            <label className="GameSettings__rangeLabel" htmlFor={option.cle}>
              {option.label}
            </label>
            <input
              id={option.cle}
              type="number"
              min={option.min}
              max={option.max}
              value={Number(valeurs[option.cle] ?? option.defaut)}
              onChange={(e) =>
                onChange({
                  ...valeurs,
                  [option.cle]: Math.max(
                    option.min,
                    Math.min(option.max, Number(e.target.value)),
                  ),
                })
              }
              className="GameSettings__range"
              style={{ maxWidth: '6rem' }}
            />
          </div>
        ) : option.type === 'unique' ? (
          <ChoixUnique
            key={option.cle}
            option={option}
            valeur={String(valeurs[option.cle] ?? option.defaut ?? '')}
            onChange={(valeur) =>
              onChange({ ...valeurs, [option.cle]: valeur })
            }
          />
        ) : (
          <ListeACocher
            key={option.cle}
            option={option}
            selection={(valeurs[option.cle] as string[]) ?? []}
            onChange={(selection) =>
              onChange({ ...valeurs, [option.cle]: selection })
            }
          />
        ),
      )}
    </div>
  );
}

/** Les choix d'une option, statiques ou charges. `null` tant qu'on ne les a pas.
 *
 * En cas d'echec on rend une liste VIDE plutot qu'une erreur : sans filtre, le module
 * tire librement, donc la feuille sort quand meme. Une page de composition bloquee par
 * une liste d'options serait pire que la liste manquante.
 */
function useChoix(
  option: Exclude<OptionImprimable, { type: 'nombre' }>,
): ChoixImprimable[] | null {
  const { choix: statiques, charger } = option;
  const [choix, setChoix] = useState<ChoixImprimable[] | null>(
    statiques ?? null,
  );

  useEffect(() => {
    if (statiques || !charger) return;
    let vivant = true;
    void charger().then(
      (recus) => vivant && setChoix(recus),
      () => vivant && setChoix([]),
    );
    return () => {
      vivant = false;
    };
  }, [statiques, charger]);

  return choix;
}

function ChoixUnique({
  option,
  valeur,
  onChange,
}: {
  option: Extract<OptionImprimable, { type: 'unique' }>;
  valeur: string;
  onChange: (valeur: string) => void;
}) {
  const choix = useChoix(option);
  if (!choix) return <p className="GameSettings__hint">Chargement…</p>;
  if (choix.length === 0) return null;

  return (
    <div>
      <p className="GameSettings__hint">
        {option.label}
        {option.defaut === undefined && <em> (rien de choisi : au hasard)</em>}
      </p>
      <div className="GameSettings__denominations">
        {choix.map((c) => (
          <button
            key={c.valeur}
            type="button"
            className={`GameSettings__denomination${
              valeur === c.valeur ? ' GameSettings__denomination--active' : ''
            }`}
            // Recliquer sur le choix actif le RETIRE quand il n'y a pas de defaut : sans
            // cela, une fois un texte choisi on ne pourrait plus revenir au tirage au
            // hasard sans recharger la page.
            onClick={() =>
              onChange(
                valeur === c.valeur && option.defaut === undefined
                  ? ''
                  : c.valeur,
              )
            }
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListeACocher({
  option,
  selection,
  onChange,
}: {
  option: Extract<OptionImprimable, { type: 'multi' }>;
  selection: string[];
  onChange: (selection: string[]) => void;
}) {
  // Les listes chargees (notions ouvertes, temps actifs, textes actifs) viennent de
  // l'administration : elles ne sont connues qu'au moment ou on ouvre la page.
  const choix = useChoix(option);

  if (!choix) return <p className="GameSettings__hint">Chargement…</p>;
  if (choix.length === 0) return null;

  return (
    <div>
      <p className="GameSettings__hint">
        {option.label} <em>(rien de coché : tout est possible)</em>
      </p>
      <div className="GameSettings__denominations">
        {choix.map((c) => (
          <button
            key={c.valeur}
            type="button"
            className={`GameSettings__denomination${
              selection.includes(c.valeur)
                ? ' GameSettings__denomination--active'
                : ''
            }`}
            onClick={() =>
              onChange(
                selection.includes(c.valeur)
                  ? selection.filter((v) => v !== c.valeur)
                  : [...selection, c.valeur],
              )
            }
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
