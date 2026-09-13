import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import TuileFaceSvg from './TuileFaceSvg';
import { identifiantFace, libelleFace } from './tuiles';
import { pairesCountDepuisSetup, tenterAppariement, tirerPaires, type TuileJeu } from './moteur';
import './mahjong.scss';

const MODULE_ID = 'mahjong';
const DELAI_ECHEC_MS = 800;
const DELAI_VICTOIRE_MS = 400;

/** Facile : aucune contrainte de position, deux tuiles de meme face forment toujours une paire. */
function peuventFormerPaireFacile(tuileA: TuileJeu, tuileB: TuileJeu): boolean {
  return identifiantFace(tuileA.face) === identifiantFace(tuileB.face);
}

function colonnesGrille(pairesCount: number): number {
  if (pairesCount <= 8) return 4;
  if (pairesCount <= 12) return 6;
  return 8;
}

export default function MahjongFacile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};
  const pairesCount = pairesCountDepuisSetup(setup['pairs_count'] as string | undefined);

  const [tuiles, setTuiles] = useState<TuileJeu[]>(() => tirerPaires(pairesCount));
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [echec, setEchec] = useState<{ idA: string; idB: string } | null>(null);
  const [essais, setEssais] = useState(0);

  // Garde contre les clics pendant le delai d'affichage d'un echec.
  const enPauseRef = useRef(false);

  const pairesTrouvees = pairesCount - tuiles.length / 2;

  const terminerPartie = useCallback(() => {
    dispatch(
      setGameResult({
        correctCount: pairesCount,
        total: pairesCount,
        scoreLabel: `${essais} essai${essais > 1 ? 's' : ''}`,
        results: [],
      }),
    );
    navigate(`/module/${MODULE_ID}/result`);
  }, [dispatch, essais, navigate, pairesCount]);

  const handleTileClick = useCallback(
    (idClique: string) => {
      if (enPauseRef.current || selectionId === idClique) return;

      if (selectionId === null) {
        setSelectionId(idClique);
        return;
      }

      setEssais((valeur) => valeur + 1);

      const { reussi, tuiles: tuilesRestantes } = tenterAppariement(
        tuiles,
        selectionId,
        idClique,
        peuventFormerPaireFacile,
      );

      if (reussi) {
        setTuiles(tuilesRestantes);
        setSelectionId(null);
        if (tuilesRestantes.length === 0) setTimeout(terminerPartie, DELAI_VICTOIRE_MS);
        return;
      }

      enPauseRef.current = true;
      setEchec({ idA: selectionId, idB: idClique });
      setTimeout(() => {
        setSelectionId(null);
        setEchec(null);
        enPauseRef.current = false;
      }, DELAI_ECHEC_MS);
    },
    [selectionId, terminerPartie, tuiles],
  );

  return (
    <div className="MahjongFacile">
      <p className="MahjongFacile__compteur">
        {pairesTrouvees} / {pairesCount} paires, {essais} essai{essais > 1 ? 's' : ''}
      </p>

      <div
        className="MahjongBoard"
        style={{ '--cols': colonnesGrille(pairesCount) } as CSSProperties}
      >
        {tuiles.map((tuile) => {
          const estSelectionnee = tuile.id === selectionId;
          const estEnEchec = echec?.idA === tuile.id || echec?.idB === tuile.id;
          return (
            <button
              key={tuile.id}
              type="button"
              className={[
                'MahjongTuile',
                estSelectionnee ? 'MahjongTuile--selectionnee' : '',
                estEnEchec ? 'MahjongTuile--echec' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-label={libelleFace(tuile.face)}
              aria-pressed={estSelectionnee}
              onClick={() => handleTileClick(tuile.id)}
            >
              <TuileFaceSvg face={tuile.face} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
