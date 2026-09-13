import { useCallback, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import TuileCube3D from './TuileCube3D';
import { libelleFace } from './tuiles';
import { trouverForme } from './formes';
import { estLibre, genererPlateauTourelle, tenterAppariementTourelle, type CaseTourelle } from './tourelle';
import './mahjong.scss';

const MODULE_ID = 'mahjong';
const DELAI_ECHEC_MS = 800;
const DELAI_VICTOIRE_MS = 400;

// Une demi-unite de coordonnee (voir tourelle.ts) vaut la moitie d'une largeur de tuile :
// une tuile pleine (2 demi-unites) fait donc LARGEUR_TUILE de large.
const LARGEUR_TUILE = 48;
const PROFONDEUR_TUILE = 68;
const DEMI_UNITE_X = LARGEUR_TUILE / 2;
const DEMI_UNITE_Y = PROFONDEUR_TUILE / 2;
/** Hauteur physique d'une tuile (axe Z) : combien un etage eleve le plateau. */
const EPAISSEUR_TUILE = 18;

export default function MahjongDifficile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};
  const forme = trouverForme(setup['forme'] as string | undefined);

  const [cases, setCases] = useState<CaseTourelle[]>(() => genererPlateauTourelle(forme));
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [echec, setEchec] = useState<{ idA: string; idB: string } | null>(null);
  const [essais, setEssais] = useState(0);

  // Garde contre les clics pendant le delai d'affichage d'un echec.
  const enPauseRef = useRef(false);

  const pairesCount = forme.slots.length / 2;
  const pairesTrouvees = pairesCount - cases.length / 2;

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

      const { reussi, cases: casesRestantes } = tenterAppariementTourelle(cases, selectionId, idClique);

      if (reussi) {
        setCases(casesRestantes);
        setSelectionId(null);
        if (casesRestantes.length === 0) setTimeout(terminerPartie, DELAI_VICTOIRE_MS);
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
    [cases, selectionId, terminerPartie],
  );

  const largeurMax = Math.max(...cases.map((c) => c.x)) + 2;
  const profondeurMax = Math.max(...cases.map((c) => c.y)) + 2;

  return (
    <div className="MahjongDifficile">
      <p className="MahjongDifficile__compteur">
        {pairesTrouvees} / {pairesCount} paires, {essais} essai{essais > 1 ? 's' : ''}
      </p>

      <div
        className="MahjongTourelle"
        style={{ width: largeurMax * DEMI_UNITE_X, height: profondeurMax * DEMI_UNITE_Y }}
      >
        {/* `perspective` (sur .MahjongTourelle) + `preserve-3d` en cascade jusqu'ici :
            chaque cube vit dans le MEME espace 3D, le navigateur les trie par profondeur
            reelle. Plus besoin de trier le tableau ni de calculer un decalage a la main :
            translateZ EST la hauteur, en vrai, pas une approximation en pixels. */}
        <div className="MahjongTourelle__scene">
          {cases.map((caseTourelle) => {
            const style: CSSProperties = {
              left: caseTourelle.x * DEMI_UNITE_X,
              top: caseTourelle.y * DEMI_UNITE_Y,
              width: LARGEUR_TUILE,
              height: PROFONDEUR_TUILE,
              transform: `translateZ(${caseTourelle.z * EPAISSEUR_TUILE}px)`,
            };

            return (
              <div key={caseTourelle.tuile.id} className="MahjongTourelleCase" style={style}>
                <TuileCube3D
                  face={caseTourelle.tuile.face}
                  largeur={LARGEUR_TUILE}
                  profondeur={PROFONDEUR_TUILE}
                  epaisseur={EPAISSEUR_TUILE}
                  libre={estLibre(cases, caseTourelle)}
                  selectionnee={caseTourelle.tuile.id === selectionId}
                  enEchec={echec?.idA === caseTourelle.tuile.id || echec?.idB === caseTourelle.tuile.id}
                  libelle={libelleFace(caseTourelle.tuile.face)}
                  onClick={() => handleTileClick(caseTourelle.tuile.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
