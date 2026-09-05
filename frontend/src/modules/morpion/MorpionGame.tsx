import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import Button from 'src/components/common/Button';
import {
  adversaire,
  creer,
  gagnant,
  meilleurCoup,
  pleine,
  type Case,
  type Joueur,
  type Plateau,
} from 'src/utils/plateau';
import {
  appliquer,
  meilleurCoup as meilleurCoupTrois,
  phase as phaseTroisPions,
  PIONS_PAR_JOUEUR,
  type Coup,
  type Niveau,
} from './troisPions';
import './morpion.scss';

const MODULE_ID = 'morpion';

/** Profondeur de recherche par niveau, RÈGLE CLASSIQUE. `0` = au hasard, donc réellement
 * battable.
 *
 * En `difficile`, le morpion est exploré ENTIÈREMENT : il ne perd jamais, au mieux on
 * fait match nul. C'est assumé et annoncé au pré-jeu — découvrir qu'un adversaire est
 * imbattable fait partie du jeu, à condition de ne pas le déguiser en « fort ».
 *
 * La règle à trois pions ne passe pas par ici : elle ne se cherche pas en profondeur,
 * elle se RÉSOUT (voir `troisPions.ts`). */
const PROFONDEUR: Record<string, number> = {
  easy: 0,
  medium: 2,
  hard: 9,
};

const SIGNE: Record<Joueur, string> = { 1: '✕', 2: '◯' };

/** Le temps que l'ordinateur « réfléchit ». Jouer instantanément donne l'impression que
 * la machine ne joue pas mais réagit — et l'enfant n'a pas le temps de voir son coup. */
const DELAI_MS = 450;

/** Combien de fois une même position peut revenir avant que la partie soit déclarée
 * nulle, en règle à trois pions.
 *
 * La grille ne se remplit jamais : sans cette règle, deux joueurs qui ne trouvent rien se
 * déplaceraient jusqu'à la fin des temps. Elle n'est pas de confort — la résolution
 * exacte montre que 400 positions sont nulles PAR BOUCLE, c'est-à-dire que ni l'un ni
 * l'autre ne peut forcer quoi que ce soit. Trois, comme aux échecs. */
const REPETITIONS_NULLES = 3;

const clePosition = (cases: Case[], tour: Joueur): string =>
  `${cases.join('')}|${tour}`;

/** Tout ce qui bouge d'un coup à l'autre, dans UN seul état.
 *
 * Séparer plateau, tour et historique laissait une faille : la garde contre le double
 * coup vivait dans la mise à jour du plateau, mais le changement de tour se faisait à
 * côté, sans condition. Deux clics dans le même lot de rendu lisaient donc un tour périmé
 * et posaient deux pions d'affilée. Réunis, la garde vaut pour les trois — il n'y a plus
 * qu'un endroit où l'état change. */
interface Partie {
  cases: Case[];
  tour: Joueur;
  /** Les positions déjà vues, pour la règle de répétition. */
  vues: string[];
}

const NEUVE: Partie = {
  cases: Array.from({ length: 9 }, () => 0 as Case),
  tour: 1,
  vues: [clePosition(Array.from({ length: 9 }, () => 0 as Case), 1)],
};

export default function MorpionGame() {
  const navigate = useNavigate();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};
  const mode = (setup.difficulty as string) || 'medium';
  const troisPions = setup.variante === 'trois';

  /** Contre la machine, ou à deux sur le même écran.
   *
   * C'était un choix de pré-jeu, rangé parmi les niveaux de difficulté — alors que ce
   * n'en est pas un, et que le pré-jeu posait déjà la question du niveau juste à côté.
   * C'est maintenant un bouton SUR le plateau : passer la main à quelqu'un ne demande
   * plus de ressortir du jeu.
   *
   * Le basculement ne remet pas la partie à zéro. Il change seulement qui tient les ronds
   * — et c'est justement l'usage : « viens, prends ma place ». */
  const [contreOrdinateur, setContreOrdinateur] = useState(true);

  const [partie, setPartie] = useState<Partie>(NEUVE);
  /** Le pion pris en main, en phase de déplacement. */
  const [selection, setSelection] = useState<number | null>(null);

  const { cases, tour, vues } = partie;
  // Le plateau que lisent `gagnant` et le minimax de la règle classique : la géométrie ne
  // change jamais, seules les cases bougent.
  const plateau = useMemo<Plateau>(
    () => ({ ...creer(3, 3, 3, false), cases }),
    [cases],
  );

  const victoire = useMemo(() => gagnant(plateau), [plateau]);
  const enDeplacement =
    troisPions && phaseTroisPions(cases) === 'deplacement';

  // Deux façons de finir sans vainqueur, et ce ne sont pas les mêmes : en classique la
  // grille se remplit, en trois pions elle ne se remplit JAMAIS et c'est la partie qui
  // tourne en rond.
  const repetee =
    troisPions &&
    vues.filter((v) => v === clePosition(cases, tour)).length >=
      REPETITIONS_NULLES;
  const nul = !victoire && (troisPions ? repetee : pleine(plateau));
  const fini = victoire !== null || nul;

  /** Le seul endroit où la partie avance.
   *
   * Tout est revérifié DANS la mise à jour, contre l'état réellement courant : le tour,
   * la case de départ, la case d'arrivée, et qu'aucun alignement n'a déjà mis fin à la
   * partie. Un clic pendant que l'ordinateur réfléchit, ou deux clics plus rapides qu'un
   * rendu, ne peuvent donc plus poser deux pions d'affilée. */
  const jouerCoup = useCallback((coup: Coup, joueur: Joueur) => {
    setPartie((precedent) => {
      if (precedent.tour !== joueur) return precedent;
      if (precedent.cases[coup.vers] !== 0) return precedent;
      if (coup.type === 'deplacement' && precedent.cases[coup.depuis] !== joueur) {
        return precedent;
      }
      if (gagnant({ ...creer(3, 3, 3, false), cases: precedent.cases })) {
        return precedent;
      }

      const suivantes = appliquer(precedent.cases, coup, joueur);
      const prochain = adversaire(joueur);
      return {
        cases: suivantes,
        tour: prochain,
        vues: [...precedent.vues, clePosition(suivantes, prochain)],
      };
    });
    setSelection(null);
  }, []);

  // Le tour de l'ordinateur. Le minuteur est nettoyé au démontage : sans ça, rejouer
  // pendant qu'il réfléchit ferait jouer son coup sur le plateau NEUF.
  useEffect(() => {
    if (!contreOrdinateur || tour !== 2 || fini) return;
    const minuteur = setTimeout(() => {
      if (troisPions) {
        const coup = meilleurCoupTrois(cases, 2, mode as Niveau);
        if (coup) jouerCoup(coup, 2);
        return;
      }
      const cellule = meilleurCoup(plateau, 2, PROFONDEUR[mode] ?? 2);
      if (cellule !== null) jouerCoup({ type: 'pose', vers: cellule }, 2);
    }, DELAI_MS);
    return () => clearTimeout(minuteur);
  }, [contreOrdinateur, tour, fini, plateau, cases, mode, troisPions, jouerCoup]);

  function cliquer(cellule: number) {
    if (fini) return;
    if (contreOrdinateur && tour !== 1) return; // ce n'est pas son tour

    if (!enDeplacement) {
      if (cases[cellule] !== 0) return;
      jouerCoup({ type: 'pose', vers: cellule }, tour);
      return;
    }

    // Phase de déplacement : on prend un pion, puis on le pose sur une case libre.
    if (cases[cellule] === tour) {
      // Retaper le pion pris le relâche — le seul moyen de se raviser.
      setSelection((precedent) => (precedent === cellule ? null : cellule));
      return;
    }
    if (cases[cellule] !== 0) return; // un pion adverse ne se prend pas
    if (selection === null) return; // aucune main : la case libre ne fait rien
    jouerCoup({ type: 'deplacement', depuis: selection, vers: cellule }, tour);
  }

  function rejouer() {
    setPartie(NEUVE);
    setSelection(null);
  }

  const consigne = enDeplacement
    ? selection === null
      ? 'Choisis un pion à déplacer.'
      : 'Pose-le sur une case libre.'
    : 'À toi de jouer.';

  const message = victoire
    ? contreOrdinateur
      ? victoire.joueur === 1
        ? 'Gagné !'
        : 'Perdu cette fois.'
      : `${SIGNE[victoire.joueur]} a gagné !`
    : nul
      ? troisPions
        ? 'Match nul : la partie tourne en rond.'
        : 'Match nul.'
      : contreOrdinateur
        ? tour === 1
          ? consigne
          : 'Il réfléchit…'
        : `Au tour de ${SIGNE[tour]} — ${consigne.toLowerCase()}`;

  return (
    <div className="MorpionGame">
      <p className="MorpionGame__message" role="status">
        {message}
      </p>

      <div className="MorpionGame__plateau" role="grid" aria-label="Morpion">
        {cases.map((valeur, cellule) => {
          const gagnante = victoire?.cellules.includes(cellule) ?? false;
          const prise = selection === cellule;
          // En déplacement, une case occupée par SES pions reste actionnable : c'est même
          // le seul moyen de jouer. La règle « une case pleine est morte » ne vaut que
          // pour la pose.
          //
          // Et rien ne l'est pendant que l'ordinateur réfléchit : sans ce garde-fou, ses
          // propres pions s'affichaient en boutons vivants pendant une demi-seconde. Le
          // clic ne faisait rien — c'est bien le problème, le curseur promettait un coup.
          const sonTour = !contreOrdinateur || tour === 1;
          const actionnable =
            sonTour &&
            (enDeplacement
              ? valeur === tour || (selection !== null && valeur === 0)
              : valeur === 0);
          return (
            <button
              key={cellule}
              type="button"
              role="gridcell"
              className={[
                'MorpionGame__case',
                gagnante ? 'MorpionGame__case--gagnante' : '',
                prise ? 'MorpionGame__case--prise' : '',
                valeur !== 0 ? `MorpionGame__case--j${valeur}` : '',
              ]
                .filter(Boolean)
                .join(' ')}
              // Une case inactionnable reste dans le DOM mais n'est plus cliquable : la
              // retirer déplacerait la grille sous le doigt.
              disabled={!actionnable || fini}
              aria-pressed={enDeplacement && valeur === tour ? prise : undefined}
              aria-label={
                valeur === 0
                  ? `case ${cellule + 1}, libre`
                  : `case ${cellule + 1}, ${SIGNE[valeur]}${prise ? ', en main' : ''}`
              }
              onClick={() => cliquer(cellule)}
            >
              {valeur !== 0 ? SIGNE[valeur] : ''}
            </button>
          );
        })}
      </div>

      {troisPions && !fini && !enDeplacement && (
        <p className="MorpionGame__reste">
          Encore{' '}
          {PIONS_PAR_JOUEUR - cases.filter((c) => c === tour).length}{' '}
          pion(s) à poser, puis on les déplace.
        </p>
      )}

      {/* La boucle d'un jeu de plateau est « je joue, je vois qui gagne, je rejoue ».
          Passer par l'écran de résultat commun, fait pour un score et une liste
          d'erreurs, ajouterait deux clics pour rien sur une grille de neuf cases. */}
      <div className="MorpionGame__actions">
        <Button variant="primary" onClick={rejouer}>
          {fini ? 'Rejouer' : 'Recommencer'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setContreOrdinateur((precedent) => !precedent)}
        >
          {contreOrdinateur ? '👥 Jouer à deux' : '🤖 Jouer contre lui'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
          Accueil
        </Button>
      </div>
    </div>
  );
}
