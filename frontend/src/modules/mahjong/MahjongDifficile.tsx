import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import TuileBloc from './TuileBloc';
import { libelleFace } from './tuiles';
import { trouverForme } from './formes';
import { estLibre, genererPlateauTourelle, tenterAppariementTourelle, type CaseTourelle } from './tourelle';
import { boiteDuPlateau, planDeSuperposition, rectangleFace } from './mahjong.geometrie';
import './mahjong.scss';

const MODULE_ID = 'mahjong';
const DELAI_ECHEC_MS = 800;
const DELAI_VICTOIRE_MS = 400;

/**
 * Le plateau est dessine a taille FIXE, en pixels de plateau (voir mahjong.geometrie.ts),
 * puis mis a l'echelle d'un bloc pour tenir dans la place disponible.
 *
 * C'est ce qui permet de garder une geometrie entiere et des constantes lisibles : sans
 * ce decouplage, chaque taille d'ecran aurait sa propre arithmetique, et le decalage d'un
 * etage finirait par tomber sur une demi-position.
 */
function useEchelle(largeurPlateau: number, hauteurPlateau: number) {
  const conteneurRef = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(1);

  useEffect(() => {
    const conteneur = conteneurRef.current;
    if (!conteneur || largeurPlateau === 0 || hauteurPlateau === 0) return;

    const mesurer = () => {
      const { width, height } = conteneur.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      // Jamais d'agrandissement : au-dela de 1, les images de tuiles se deliteraient.
      setEchelle(Math.min(1, width / largeurPlateau, height / hauteurPlateau));
    };

    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(conteneur);
    return () => observateur.disconnect();
  }, [largeurPlateau, hauteurPlateau]);

  return { conteneurRef, echelle };
}

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

  // La boite se calcule sur la disposition COMPLETE, pas sur les tuiles restantes : sinon
  // le plateau se recentre et grandit a chaque paire retiree, et l'enfant perd de vue ou
  // se trouvait ce qu'elle regardait.
  const boite = useMemo(() => boiteDuPlateau(forme.slots), [forme]);
  const { conteneurRef, echelle } = useEchelle(boite.largeur, boite.hauteur);
  const zSommet = useMemo(() => Math.max(...forme.slots.map((s) => s.z)), [forme]);

  return (
    <div className="MahjongDifficile">
      <p className="MahjongDifficile__compteur">
        {pairesTrouvees} / {pairesCount} paires, {essais} essai{essais > 1 ? 's' : ''}
      </p>

      <div className="MahjongTourelle" ref={conteneurRef}>
        {/* Deux boites imbriquees, et c'est necessaire. `transform` ne change pas la
            place qu'un element occupe : une scene de 598 px reduite a 0,47 occupe
            toujours 598 px, deborde du conteneur, et le centrage ne s'applique plus a
            rien. Le cadre porte donc la taille REELLE apres reduction, la scene garde
            ses pixels de plateau, et la reduction part de son coin haut-gauche pour que
            les deux coincident.

            Une seule mise a l'echelle pour tout le plateau : les tuiles gardent des
            positions entieres, et le navigateur n'a qu'une transformation a appliquer
            plutot que 144. */}
        <div
          className="MahjongTourelle__cadre"
          style={{ width: boite.largeur * echelle, height: boite.hauteur * echelle }}
        >
          <div
            className="MahjongTourelle__scene"
            style={{
              width: boite.largeur,
              height: boite.hauteur,
              transform: `scale(${echelle})`,
            }}
          >
            {cases.map((caseTourelle) => {
              const face = rectangleFace(caseTourelle);
              const style: CSSProperties = {
                left: face.x - boite.x,
                top: face.y - boite.y,
                // La superposition suit la geometrie, l'ordre du DOM reste celui des
                // tuiles : voir `planDeSuperposition`.
                zIndex: planDeSuperposition(caseTourelle),
              };

              return (
                <div key={caseTourelle.tuile.id} className="MahjongTourelleCase" style={style}>
                  <TuileBloc
                    face={caseTourelle.tuile.face}
                    z={caseTourelle.z}
                    zSommet={zSommet}
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
    </div>
  );
}
