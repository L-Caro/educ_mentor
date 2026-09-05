import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import Button from 'src/components/common/Button';
import {
  adversaire,
  chute,
  creer,
  gagnant,
  jouer,
  meilleurCoup,
  pleine,
  type Joueur,
  type Plateau,
} from 'src/utils/plateau';
import './puissance4.scss';

const MODULE_ID = 'puissance4';

const COLONNES = 7;
const LIGNES = 6;

/** Profondeur de recherche par niveau.
 *
 * Le Puissance 4 n'est pas explorable en entier — sa résolution complète demande des
 * heures de calcul et une base d'ouvertures. `difficile` reste donc battable, et c'est
 * tant mieux : contrairement au morpion, on ne promet pas qu'il ne perd jamais. */
const PROFONDEUR: Record<string, number> = {
  facile: 0,
  moyen: 2,
  difficile: 5,
};

const DELAI_MS = 500;

export default function Puissance4Game() {
  const navigate = useNavigate();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};
  const mode = (setup.adversaire as string) || 'moyen';
  const contreOrdinateur = mode !== 'deux';

  const [plateau, setPlateau] = useState<Plateau>(() =>
    creer(COLONNES, LIGNES, 4, true),
  );
  const [tour, setTour] = useState<Joueur>(1);
  /** La dernière case posée, pour l'animation de chute. */
  const [derniere, setDerniere] = useState<number | null>(null);

  const victoire = useMemo(() => gagnant(plateau), [plateau]);
  const nul = !victoire && pleine(plateau);
  const fini = victoire !== null || nul;

  const poser = useCallback((cellule: number, joueur: Joueur) => {
    setPlateau((precedent) => {
      if (precedent.cases[cellule] !== 0 || gagnant(precedent)) return precedent;
      return jouer(precedent, cellule, joueur);
    });
    setDerniere(cellule);
    setTour(adversaire(joueur));
  }, []);

  useEffect(() => {
    if (!contreOrdinateur || tour !== 2 || fini) return;
    const minuteur = setTimeout(() => {
      const coup = meilleurCoup(plateau, 2, PROFONDEUR[mode] ?? 2);
      if (coup !== null) poser(coup, 2);
    }, DELAI_MS);
    return () => clearTimeout(minuteur);
  }, [contreOrdinateur, tour, fini, plateau, mode, poser]);

  /** On clique une COLONNE, pas une case : c'est la gravité qui décide où le jeton
   * tombe, et laisser viser une case précise donnerait l'illusion du contraire. */
  function jouerColonne(colonne: number) {
    if (fini) return;
    if (contreOrdinateur && tour !== 1) return;
    const cellule = chute(plateau, colonne);
    if (cellule === null) return; // colonne pleine
    poser(cellule, tour);
  }

  function rejouer() {
    setPlateau(creer(COLONNES, LIGNES, 4, true));
    setTour(1);
    setDerniere(null);
  }

  const message = victoire
    ? contreOrdinateur
      ? victoire.joueur === 1
        ? 'Gagné !'
        : 'Perdu cette fois.'
      : `Le joueur ${victoire.joueur} a gagné !`
    : nul
      ? 'Match nul, la grille est pleine.'
      : contreOrdinateur
        ? tour === 1
          ? 'À toi de jouer.'
          : 'Il réfléchit…'
        : `Au tour du joueur ${tour}`;

  const monTour = !fini && (!contreOrdinateur || tour === 1);

  return (
    <div className="Puissance4Game">
      <p className="Puissance4Game__message" role="status">
        {message}
      </p>

      <div className="Puissance4Game__plateau" role="grid" aria-label="Puissance 4">
        {Array.from({ length: COLONNES }, (_, colonne) => {
          const pleineColonne = chute(plateau, colonne) === null;
          return (
            <button
              key={colonne}
              type="button"
              className="Puissance4Game__colonne"
              disabled={pleineColonne || !monTour}
              aria-label={`colonne ${colonne + 1}${pleineColonne ? ', pleine' : ''}`}
              onClick={() => jouerColonne(colonne)}
            >
              {Array.from({ length: LIGNES }, (_, ligne) => {
                const cellule = ligne * COLONNES + colonne;
                const valeur = plateau.cases[cellule];
                const gagnante = victoire?.cellules.includes(cellule) ?? false;
                return (
                  <span
                    key={ligne}
                    role="gridcell"
                    aria-label={
                      valeur === 0 ? 'vide' : `joueur ${valeur}`
                    }
                    className={[
                      'Puissance4Game__case',
                      valeur !== 0 ? `Puissance4Game__case--j${valeur}` : '',
                      gagnante ? 'Puissance4Game__case--gagnante' : '',
                      cellule === derniere ? 'Puissance4Game__case--tombe' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                );
              })}
            </button>
          );
        })}
      </div>

      <div className="Puissance4Game__actions">
        <Button variant="primary" onClick={rejouer}>
          {fini ? 'Rejouer' : 'Recommencer'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          Accueil
        </Button>
      </div>
    </div>
  );
}
