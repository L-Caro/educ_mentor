import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import Button from 'src/components/common/Button';
import {
  adversaire,
  creer,
  gagnant,
  jouer,
  meilleurCoup,
  pleine,
  type Joueur,
  type Plateau,
} from 'src/utils/plateau';
import './morpion.scss';

const MODULE_ID = 'morpion';

/** Profondeur de recherche par niveau. `0` = au hasard, donc réellement battable.
 *
 * En `difficile`, le morpion est exploré ENTIÈREMENT : il ne perd jamais, au mieux on
 * fait match nul. C'est assumé et annoncé au pré-jeu — découvrir qu'un adversaire est
 * imbattable fait partie du jeu, à condition de ne pas le déguiser en « fort ». */
const PROFONDEUR: Record<string, number> = {
  facile: 0,
  moyen: 2,
  difficile: 9,
};

const SIGNE: Record<Joueur, string> = { 1: '✕', 2: '◯' };

/** Le temps que l'ordinateur « réfléchit ». Jouer instantanément donne l'impression que
 * la machine ne joue pas mais réagit — et l'enfant n'a pas le temps de voir son coup. */
const DELAI_MS = 450;

export default function MorpionGame() {
  const navigate = useNavigate();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};
  const mode = (setup.adversaire as string) || 'moyen';
  const contreOrdinateur = mode !== 'deux';

  const [plateau, setPlateau] = useState<Plateau>(() => creer(3, 3, 3, false));
  const [tour, setTour] = useState<Joueur>(1);

  const victoire = useMemo(() => gagnant(plateau), [plateau]);
  const nul = !victoire && pleine(plateau);
  const fini = victoire !== null || nul;

  const poser = useCallback(
    (cellule: number, joueur: Joueur) => {
      setPlateau((precedent) => {
        // Garde contre un double coup : un clic pendant que l'ordinateur réfléchit, ou
        // deux clics rapides sur la même case, ne doivent pas écraser le plateau.
        if (precedent.cases[cellule] !== 0 || gagnant(precedent)) return precedent;
        return jouer(precedent, cellule, joueur);
      });
      setTour(adversaire(joueur));
    },
    [],
  );

  // Le tour de l'ordinateur. Le minuteur est nettoyé au démontage : sans ça, rejouer
  // pendant qu'il réfléchit ferait jouer son coup sur le plateau NEUF.
  useEffect(() => {
    if (!contreOrdinateur || tour !== 2 || fini) return;
    const minuteur = setTimeout(() => {
      const coup = meilleurCoup(plateau, 2, PROFONDEUR[mode] ?? 2);
      if (coup !== null) poser(coup, 2);
    }, DELAI_MS);
    return () => clearTimeout(minuteur);
  }, [contreOrdinateur, tour, fini, plateau, mode, poser]);

  function cliquer(cellule: number) {
    if (fini || plateau.cases[cellule] !== 0) return;
    if (contreOrdinateur && tour !== 1) return; // ce n'est pas son tour
    poser(cellule, tour);
  }

  function rejouer() {
    setPlateau(creer(3, 3, 3, false));
    setTour(1);
  }

  const message = victoire
    ? contreOrdinateur
      ? victoire.joueur === 1
        ? 'Gagné !'
        : 'Perdu cette fois.'
      : `${SIGNE[victoire.joueur]} a gagné !`
    : nul
      ? 'Match nul.'
      : contreOrdinateur
        ? tour === 1
          ? 'À toi de jouer.'
          : 'Il réfléchit…'
        : `Au tour de ${SIGNE[tour]}`;

  return (
    <div className="MorpionGame">
      <p className="MorpionGame__message" role="status">
        {message}
      </p>

      <div className="MorpionGame__plateau" role="grid" aria-label="Morpion">
        {plateau.cases.map((valeur, cellule) => {
          const gagnante = victoire?.cellules.includes(cellule) ?? false;
          return (
            <button
              key={cellule}
              type="button"
              role="gridcell"
              className={[
                'MorpionGame__case',
                gagnante ? 'MorpionGame__case--gagnante' : '',
                valeur !== 0 ? `MorpionGame__case--j${valeur}` : '',
              ]
                .filter(Boolean)
                .join(' ')}
              // Une case occupée reste dans le DOM mais n'est plus actionnable : la
              // retirer déplacerait la grille sous le doigt.
              disabled={valeur !== 0 || fini}
              aria-label={
                valeur === 0
                  ? `case ${cellule + 1}, libre`
                  : `case ${cellule + 1}, ${SIGNE[valeur]}`
              }
              onClick={() => cliquer(cellule)}
            >
              {valeur !== 0 ? SIGNE[valeur] : ''}
            </button>
          );
        })}
      </div>

      {/* La boucle d'un jeu de plateau est « je joue, je vois qui gagne, je rejoue ».
          Passer par l'écran de résultat commun, fait pour un score et une liste
          d'erreurs, ajouterait deux clics pour rien sur une grille de neuf cases. */}
      <div className="MorpionGame__actions">
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
