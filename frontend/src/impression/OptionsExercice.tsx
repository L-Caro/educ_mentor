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
 * Deux formes seulement : une liste a cocher, ou un nombre. C'est assez pour tout ce que
 * les modules demandent (quelles tables, quelles notions, combien de formes), et s'en
 * tenir a deux evite que chaque module invente son propre formulaire.
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
        ) : (
          <ListeACocher
            key={option.cle}
            option={option}
            selection={(valeurs[option.cle] as string[]) ?? []}
            onChange={(selection) => onChange({ ...valeurs, [option.cle]: selection })}
          />
        ),
      )}
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
  const [choix, setChoix] = useState<ChoixImprimable[] | null>(option.choix ?? null);

  // Les listes chargees (notions ouvertes, temps actifs) viennent de l'administration :
  // elles ne sont connues qu'au moment ou on ouvre la page. En cas d'echec on affiche une
  // liste vide plutot qu'une erreur : sans filtre, le module tire librement, donc la
  // feuille sort quand meme.
  useEffect(() => {
    if (option.choix || !option.charger) return;
    let vivant = true;
    void option.charger().then(
      (recus) => vivant && setChoix(recus),
      () => vivant && setChoix([]),
    );
    return () => {
      vivant = false;
    };
  }, [option]);

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
              selection.includes(c.valeur) ? ' GameSettings__denomination--active' : ''
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
