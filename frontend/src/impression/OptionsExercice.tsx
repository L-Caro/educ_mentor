import { Fragment, useEffect, useState } from 'react';
import type { ChoixImprimable, OptionImprimable } from './impression.types';
import './impression.scss';

interface Props {
  options: OptionImprimable[];
  valeurs: Record<string, unknown>;
  /** Les types d'exercices coches. Un reglage qui ne concerne aucun d'eux est masque :
   * « jusqu'ou va la table de Pythagore » n'a rien a dire quand on imprime des
   * `7 x 8 = ...`, et le montrer quand meme ferait decider d'autre chose que ce qu'on
   * compose. */
  coches: string[];
  onChange: (valeurs: Record<string, unknown>) => void;
}

/**
 * Les reglages d'un exercice, sous son compteur.
 *
 * Quatre formes seulement : une liste a cocher, un choix unique, un nombre, ou une
 * grille de cases. C'est assez pour tout ce que les modules demandent (quelles tables,
 * quels chiffres au cadran, combien de formes, quels trous dans la table de Pythagore), et
 * s'en tenir a quatre evite que chaque module invente son propre formulaire.
 *
 * Rien de coche vaut « pas de filtre » et non « rien » : c'est le comportement des
 * modules, qui tirent librement quand la liste est vide. Une case a cocher qui, decochee,
 * viderait la feuille serait un piege.
 */
export default function OptionsExercice({
  options,
  valeurs,
  coches,
  onChange,
}: Props) {
  const utiles = options.filter(
    (option) => !option.pour || option.pour.some((cle) => coches.includes(cle)),
  );

  return (
    <div className="Impression__options">
      {utiles.map((option) =>
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
        ) : option.type === 'grille' ? (
          <Grille
            key={option.cle}
            option={option}
            selection={(valeurs[option.cle] as string[]) ?? []}
            cote={option.cote(valeurs)}
            onChange={(selection) =>
              onChange({ ...valeurs, [option.cle]: selection })
            }
          />
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
  option: Extract<OptionImprimable, { type: 'multi' | 'unique' }>,
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

/**
 * Une grille de cases a trouer, du clic ou du glisser.
 *
 * Le glisser compte : on troue rarement une case isolee, on troue une ligne, une colonne,
 * un coin de la table. Cliquer trente fois pour cela decourage d'essayer, et la
 * fonctionnalite finit inutilisee faute d'etre praticable.
 *
 * Les EN-TETES aussi. « Je veux la table de 3 » est la facon dont on pense une table de
 * Pythagore, et sans en-tetes il fallait compter les rangees pour la trouver. Cliquer sur
 * le 3 de la colonne de gauche troue la rangee entiere, et le reclique la rend.
 */
function Grille({
  option,
  selection,
  cote,
  onChange,
}: {
  option: Extract<OptionImprimable, { type: 'grille' }>;
  selection: string[];
  cote: number;
  onChange: (selection: string[]) => void;
}) {
  const [glisse, setGlisse] = useState<'ajoute' | 'retire' | null>(null);
  const rangs = Array.from({ length: cote }, (_, i) => i + 1);

  function appliquer(cles: string[], mode: 'ajoute' | 'retire') {
    if (mode === 'ajoute') {
      const ajout = cles.filter((cle) => !selection.includes(cle));
      if (ajout.length > 0) onChange([...selection, ...ajout]);
    } else {
      const restant = selection.filter((cle) => !cles.includes(cle));
      if (restant.length !== selection.length) onChange(restant);
    }
  }

  /** Une rangee ou une colonne entiere. Deja toute trouee, on la rend : sans cela on ne
   * pourrait plus revenir en arriere qu'en decochant les dix cases une par une. */
  function basculerSerie(cles: string[]) {
    const toutes = cles.every((cle) => selection.includes(cle));
    appliquer(cles, toutes ? 'retire' : 'ajoute');
  }

  return (
    <div
      onPointerUp={() => setGlisse(null)}
      onPointerLeave={() => setGlisse(null)}
    >
      <p className="GameSettings__hint">
        {option.label}{' '}
        {selection.length === 0 ? (
          <em>(aucune case : les trous seront tirés au hasard)</em>
        ) : (
          <em>
            ({selection.length} trou{selection.length > 1 ? 's' : ''})
          </em>
        )}
      </p>
      <div
        className="Grille"
        style={{ ['--cote' as string]: cote + 1 }}
        role="group"
        aria-label={option.label}
      >
        <span className="Grille__coin" aria-hidden="true">
          ×
        </span>
        {rangs.map((colonne) => (
          <button
            key={`c${String(colonne)}`}
            type="button"
            className="Grille__entete"
            title={`Trouer toute la colonne ${String(colonne)}`}
            onClick={() =>
              basculerSerie(
                rangs.map((ligne) => `${String(ligne)},${String(colonne)}`),
              )
            }
          >
            {colonne}
          </button>
        ))}

        {rangs.map((ligne) => (
          <Fragment key={`l${String(ligne)}`}>
            <button
              type="button"
              className="Grille__entete"
              title={`Trouer toute la table de ${String(ligne)}`}
              onClick={() =>
                basculerSerie(
                  rangs.map((colonne) => `${String(ligne)},${String(colonne)}`),
                )
              }
            >
              {ligne}
            </button>
            {rangs.map((colonne) => {
              const cle = `${String(ligne)},${String(colonne)}`;
              const troue = selection.includes(cle);
              return (
                <button
                  key={cle}
                  type="button"
                  className={`Grille__case${troue ? ' Grille__case--troue' : ''}`}
                  aria-pressed={troue}
                  aria-label={`${String(ligne)} fois ${String(colonne)}`}
                  onPointerDown={() => {
                    const mode = troue ? 'retire' : 'ajoute';
                    setGlisse(mode);
                    appliquer([cle], mode);
                  }}
                  onPointerEnter={() => glisse && appliquer([cle], glisse)}
                >
                  {option.contenu(ligne, colonne)}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
      {selection.length > 0 && (
        <button
          type="button"
          className="AdminBtn AdminBtn--ghost"
          onClick={() => onChange([])}
        >
          Tout effacer
        </button>
      )}
    </div>
  );
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
