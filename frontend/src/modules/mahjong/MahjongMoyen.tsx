import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import TuileFaceSvg from './TuileFaceSvg';
import { libelleFace } from './tuiles';
import { pairesCountDepuisSetup, tirerPaires } from './moteur';
import {
  construireGrilleConnect,
  tenterAppariementConnect,
  type GrilleConnect,
  type Position,
} from './connect';
import './mahjong.scss';

const MODULE_ID = 'mahjong';
const DELAI_ECHEC_MS = 800;
const DELAI_VICTOIRE_MS = 400;

function memePosition(a: Position, b: Position): boolean {
  return a.ligne === b.ligne && a.colonne === b.colonne;
}

function compterTuilesRestantes(grille: GrilleConnect): number {
  return grille.reduce((total, ligne) => total + ligne.filter((tuile) => tuile !== null).length, 0);
}

/**
 * Moyen : Mahjong Connect. Meme moteur de tirage que Facile (`tirerPaires`), mais les
 * tuiles sont posees sur une grille et deux tuiles ne s'apparient que si un chemin d'au
 * plus deux coudes les relie (voir connect.ts).
 */
export default function MahjongMoyen() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};
  const pairesCount = pairesCountDepuisSetup(setup['pairs_count'] as string | undefined);

  const [grille, setGrille] = useState<GrilleConnect>(() =>
    construireGrilleConnect(tirerPaires(pairesCount)),
  );
  const [selection, setSelection] = useState<Position | null>(null);
  const [echec, setEchec] = useState<{ a: Position; b: Position } | null>(null);
  const [essais, setEssais] = useState(0);

  // Garde contre les clics pendant le delai d'affichage d'un echec.
  const enPauseRef = useRef(false);

  const pairesTrouvees = pairesCount - compterTuilesRestantes(grille) / 2;
  const colonnes = grille[0]?.length ?? 0;

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
    (position: Position) => {
      if (enPauseRef.current || (selection && memePosition(selection, position))) return;

      if (!selection) {
        setSelection(position);
        return;
      }

      setEssais((valeur) => valeur + 1);

      const { reussi, grille: grilleSuivante } = tenterAppariementConnect(grille, selection, position);

      if (reussi) {
        setGrille(grilleSuivante);
        setSelection(null);
        if (compterTuilesRestantes(grilleSuivante) === 0) setTimeout(terminerPartie, DELAI_VICTOIRE_MS);
        return;
      }

      enPauseRef.current = true;
      setEchec({ a: selection, b: position });
      setTimeout(() => {
        setSelection(null);
        setEchec(null);
        enPauseRef.current = false;
      }, DELAI_ECHEC_MS);
    },
    [grille, selection, terminerPartie],
  );

  return (
    <div className="MahjongMoyen">
      <p className="MahjongMoyen__compteur">
        {pairesTrouvees} / {pairesCount} paires, {essais} essai{essais > 1 ? 's' : ''}
      </p>

      <div className="MahjongGrilleConnect" style={{ '--cols': colonnes } as CSSProperties}>
        {grille.flatMap((ligneTuiles, ligne) =>
          ligneTuiles.map((tuile, colonne) => {
            const position: Position = { ligne, colonne };

            if (!tuile) {
              return (
                <div
                  key={`${ligne}-${colonne}`}
                  className="MahjongGrilleConnect__case MahjongGrilleConnect__case--vide"
                />
              );
            }

            const estSelectionnee = selection !== null && memePosition(selection, position);
            const estEnEchec =
              echec !== null && (memePosition(echec.a, position) || memePosition(echec.b, position));

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
                onClick={() => handleTileClick(position)}
              >
                <TuileFaceSvg face={tuile.face} />
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
