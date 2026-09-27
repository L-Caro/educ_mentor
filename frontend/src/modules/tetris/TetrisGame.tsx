import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import { dessinerApercu, dessinerPlateau } from './tetris.dessin';
import {
  COLONNES,
  LIGNES,
  apparaitre,
  chute,
  deplacer,
  figerPiece,
  heurte,
  nouveauSac,
  plateauVide,
  tourner,
  vitesse,
  type Piece,
  type Plateau,
  type Sorte,
} from './tetris.logic';
import './tetris.scss';

const MODULE_ID = 'tetris';

/** Le temps laisse a la piece une fois posee avant qu'elle ne se fige.
 *
 * Sans ce repit, une piece qui touche le tas est perdue a l'instant ou elle le touche : a
 * sept ans on voit la bonne place une demi-seconde trop tard, toujours. Un geste pendant
 * ce delai le relance, mais pas indefiniment, sinon on ne pose plus jamais. */
const REPIT_MS = 500;
const REPITS_MAXIMUM = 10;

/** Le temps de battement blanc d'une ligne pleine avant qu'elle ne disparaisse. */
const CLIGNOTEMENT_MS = 130;

/** Un appui maintenu : le premier pas, puis la repetition. Les valeurs du Tetris
 * d'origine ; plus court, la piece part toute seule au moindre appui. */
const REPETITION_DEBUT_MS = 180;
const REPETITION_MS = 55;

interface Etat {
  plateau: Plateau;
  piece: Piece | null;
  sac: Sorte[];
  score: number;
  lignes: number;
  niveau: number;
  /** Depuis quand la piece attend de se figer, et combien de fois on l'a relance. */
  poseDepuis: number | null;
  repits: number;
  /** Les lignes en train de clignoter, et depuis quand. */
  clignote: number[];
  clignoteDepuis: number;
  fini: boolean;
  pause: boolean;
  dernierPas: number;
  descenteRapide: boolean;
}

export default function TetrisGame() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};

  const niveauDepart = Number((setup['vitesse'] as string | undefined) ?? '2');
  const avecOmbre = ((setup['ombre'] as string | undefined) ?? 'oui') === 'oui';

  const cadreRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const apercuRef = useRef<HTMLCanvasElement>(null);
  const coteRef = useRef(0);

  // Ce que l'on AFFICHE, et rien d'autre : le plateau vit dans un ref, sinon chaque
  // chute d'une ligne redessinerait tout React soixante fois par seconde.
  const [hud, setHud] = useState({
    score: 0,
    lignes: 0,
    niveau: niveauDepart,
    suivante: null as Sorte | null,
    pause: false,
  });

  const etat = useRef<Etat>({
    plateau: plateauVide(),
    piece: null,
    sac: [],
    score: 0,
    lignes: 0,
    niveau: niveauDepart,
    poseDepuis: null,
    repits: 0,
    clignote: [],
    clignoteDepuis: 0,
    fini: false,
    pause: false,
    dernierPas: 0,
    descenteRapide: false,
  });

  const rand = (min: number, max: number) =>
    min + Math.floor(Math.random() * (max - min + 1));

  /** Prend la piece suivante dans le sac, en le regarnissant s'il est vide. */
  const tirer = useCallback((e: Etat): Sorte => {
    if (e.sac.length <= 1) e.sac.push(...nouveauSac(rand));
    return e.sac.shift()!;
  }, []);

  const terminer = useCallback(
    (score: number) => {
      dispatch(
        setGameResult({
          correctCount: score,
          scoreLabel: 'points',
          results: [],
        }),
      );
      navigate(`/module/${MODULE_ID}/result`);
    },
    [dispatch, navigate],
  );

  const rafraichirHud = useCallback((e: Etat) => {
    setHud((precedent) => {
      const suivante = e.sac[0] ?? null;
      if (
        precedent.score === e.score &&
        precedent.lignes === e.lignes &&
        precedent.niveau === e.niveau &&
        precedent.suivante === suivante &&
        precedent.pause === e.pause
      ) {
        return precedent;
      }
      return {
        score: e.score,
        lignes: e.lignes,
        niveau: e.niveau,
        suivante,
        pause: e.pause,
      };
    });
  }, []);

  /** Ce que le plateau devient une fois le battement blanc termine. */
  const apresClignotement = useRef<Plateau | null>(null);

  /** Fige la piece : la regle vit dans `figerPiece`, ici on ne fait que ranger ce
   * qu'elle rend et lancer le battement blanc s'il y a des lignes a montrer. */
  const figer = useCallback(
    (e: Etat) => {
      if (!e.piece) return;
      const apres = figerPiece(
        e.plateau,
        e.piece,
        e.score,
        e.lignes,
        niveauDepart,
      );
      e.score = apres.score;
      e.lignes = apres.lignes;
      e.niveau = apres.niveau;
      e.piece = null;
      e.poseDepuis = null;
      e.repits = 0;

      if (apres.effacees.length > 0) {
        e.plateau = apres.clignotant;
        e.clignote = apres.effacees;
        e.clignoteDepuis = performance.now();
        apresClignotement.current = apres.suivant;
        return;
      }
      e.plateau = apres.suivant;
    },
    [niveauDepart],
  );

  /** Fait apparaitre la piece suivante, ou termine la partie si elle n'a pas la place. */
  const faireApparaitre = useCallback(
    (e: Etat) => {
      const piece = apparaitre(tirer(e));
      if (heurte(e.plateau, piece)) {
        e.fini = true;
        e.piece = null;
        return;
      }
      e.piece = piece;
      e.dernierPas = performance.now();
    },
    [tirer],
  );

  // ─── Les gestes ───────────────────────────────────────────────────────────

  const jouable = (e: Etat) => !e.fini && !e.pause && e.piece !== null;

  /** Relance le repit : un geste reussi pendant que la piece est posee lui redonne du
   * temps, jusqu'a la limite. */
  const relancer = (e: Etat) => {
    if (e.poseDepuis !== null && e.repits < REPITS_MAXIMUM) {
      e.poseDepuis = performance.now();
      e.repits++;
    }
  };

  const glisser = useCallback((dx: number) => {
    const e = etat.current;
    if (!jouable(e)) return;
    const bouge = deplacer(e.plateau, e.piece!, dx, 0);
    if (!bouge) return;
    e.piece = bouge;
    relancer(e);
  }, []);

  const pivoter = useCallback((sens: 1 | -1) => {
    const e = etat.current;
    if (!jouable(e)) return;
    const tourne = tourner(e.plateau, e.piece!, sens);
    if (!tourne) return;
    e.piece = tourne;
    relancer(e);
  }, []);

  const descendre = useCallback(() => {
    const e = etat.current;
    if (!jouable(e)) return;
    const bas = deplacer(e.plateau, e.piece!, 0, 1);
    if (!bas) return;
    e.piece = bas;
    // Un point par case gagnee a la main : la descente rapide doit rapporter quelque
    // chose, sinon elle ne sert qu'a raccourcir l'attente.
    e.score += 1;
    e.dernierPas = performance.now();
  }, []);

  const lacher = useCallback(() => {
    const e = etat.current;
    if (!jouable(e)) return;
    const bas = chute(e.plateau, e.piece!);
    e.score += Math.max(0, bas.y - e.piece!.y) * 2;
    e.piece = bas;
    figer(e);
  }, [figer]);

  const basculerPause = useCallback(() => {
    const e = etat.current;
    if (e.fini) return;
    e.pause = !e.pause;
    e.dernierPas = performance.now();
    if (e.poseDepuis !== null) e.poseDepuis = performance.now();
    rafraichirHud(e);
  }, [rafraichirHud]);

  // ─── La boucle ────────────────────────────────────────────────────────────

  useEffect(() => {
    const cadre = cadreRef.current;
    const canvas = canvasRef.current;
    if (!cadre || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const e = etat.current;
    e.sac = nouveauSac(rand);
    faireApparaitre(e);
    rafraichirHud(e);

    let image = 0;

    function redimensionner() {
      const dpr = window.devicePixelRatio || 1;
      const cote = Math.max(
        8,
        Math.floor(
          Math.min(cadre!.clientWidth / COLONNES, cadre!.clientHeight / LIGNES),
        ),
      );
      coteRef.current = cote;
      canvas!.width = COLONNES * cote * dpr;
      canvas!.height = LIGNES * cote * dpr;
      canvas!.style.width = `${String(COLONNES * cote)}px`;
      canvas!.style.height = `${String(LIGNES * cote)}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function tour(maintenant: number) {
      const jeu = etat.current;

      if (jeu.clignote.length > 0) {
        // Le battement blanc : rien ne bouge tant qu'il dure.
        if (maintenant - jeu.clignoteDepuis >= CLIGNOTEMENT_MS) {
          jeu.plateau = apresClignotement.current ?? jeu.plateau;
          apresClignotement.current = null;
          jeu.clignote = [];
        }
      } else if (!jeu.pause && !jeu.fini) {
        if (!jeu.piece) {
          faireApparaitre(jeu);
        } else {
          const delai = jeu.descenteRapide
            ? Math.min(vitesse(jeu.niveau), 50)
            : vitesse(jeu.niveau);

          if (maintenant - jeu.dernierPas >= delai) {
            const bas = deplacer(jeu.plateau, jeu.piece, 0, 1);
            if (bas) {
              jeu.piece = bas;
              jeu.poseDepuis = null;
              jeu.repits = 0;
              if (jeu.descenteRapide) jeu.score += 1;
            } else if (jeu.poseDepuis === null) {
              jeu.poseDepuis = maintenant;
            }
            jeu.dernierPas = maintenant;
          }

          if (
            jeu.poseDepuis !== null &&
            maintenant - jeu.poseDepuis >= REPIT_MS &&
            !deplacer(jeu.plateau, jeu.piece, 0, 1)
          ) {
            figer(jeu);
          }
        }
      }

      const ombre =
        avecOmbre && jeu.piece && !jeu.pause
          ? chute(jeu.plateau, jeu.piece)
          : null;
      // La piece reste visible en pause : la voir disparaitre donne a croire qu'elle est
      // perdue. C'est l'OMBRE qui s'efface, parce qu'elle indique ou poser, et l'on ne
      // pose rien tant que c'est arrete.
      dessinerPlateau(
        ctx!,
        jeu.plateau,
        jeu.piece,
        ombre,
        coteRef.current,
        jeu.clignote,
      );
      rafraichirHud(jeu);

      if (jeu.fini) {
        terminer(jeu.score);
        return;
      }
      image = requestAnimationFrame(tour);
    }

    const observateur = new ResizeObserver(redimensionner);
    observateur.observe(cadre);
    redimensionner();
    image = requestAnimationFrame(tour);

    return () => {
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
    // Une seule installation : relancer la boucle remettrait la partie a zero.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // L'apercu de la piece suivante, redessine quand elle change.
  useEffect(() => {
    const canvas = apercuRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const largeur = canvas.clientWidth;
    const hauteur = canvas.clientHeight;
    canvas.width = largeur * dpr;
    canvas.height = hauteur * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dessinerApercu(ctx, hud.suivante, largeur, hauteur);
  }, [hud.suivante]);

  // ─── Le clavier ───────────────────────────────────────────────────────────

  useEffect(() => {
    function appui(evenement: KeyboardEvent) {
      const touches: Record<string, () => void> = {
        ArrowLeft: () => glisser(-1),
        ArrowRight: () => glisser(1),
        ArrowUp: () => pivoter(1),
        x: () => pivoter(1),
        X: () => pivoter(1),
        z: () => pivoter(-1),
        Z: () => pivoter(-1),
        ' ': lacher,
        p: basculerPause,
        P: basculerPause,
        Escape: basculerPause,
      };
      if (evenement.key === 'ArrowDown') {
        etat.current.descenteRapide = true;
        evenement.preventDefault();
        return;
      }
      const geste = touches[evenement.key];
      if (!geste) return;
      // Sans cela, la barre d'espace fait defiler la page pendant qu'on joue.
      evenement.preventDefault();
      if (evenement.repeat && evenement.key === ' ') return;
      geste();
    }

    function relache(evenement: KeyboardEvent) {
      if (evenement.key === 'ArrowDown') etat.current.descenteRapide = false;
    }

    window.addEventListener('keydown', appui);
    window.addEventListener('keyup', relache);
    return () => {
      window.removeEventListener('keydown', appui);
      window.removeEventListener('keyup', relache);
    };
  }, [glisser, pivoter, lacher, basculerPause]);

  // ─── Les boutons ──────────────────────────────────────────────────────────

  const repetition = useRef<number | null>(null);
  const attente = useRef<number | null>(null);

  const arreter = useCallback(() => {
    if (attente.current !== null) window.clearTimeout(attente.current);
    if (repetition.current !== null) window.clearInterval(repetition.current);
    attente.current = null;
    repetition.current = null;
    etat.current.descenteRapide = false;
  }, []);

  /** Un appui maintenu sur une fleche repete le geste, comme au clavier. */
  const maintenir = useCallback(
    (geste: () => void) => {
      arreter();
      geste();
      attente.current = window.setTimeout(() => {
        repetition.current = window.setInterval(geste, REPETITION_MS);
      }, REPETITION_DEBUT_MS);
    },
    [arreter],
  );

  useEffect(() => arreter, [arreter]);

  const fleche = (libelle: string, etiquette: string, geste: () => void) => (
    <button
      type="button"
      className="Tetris__bouton"
      aria-label={etiquette}
      onPointerDown={(evenement) => {
        // Sans cela, un appui maintenu sur tablette selectionne le bouton et ouvre le
        // menu de copie au bout d'une seconde.
        evenement.preventDefault();
        maintenir(geste);
      }}
      onPointerUp={arreter}
      onPointerLeave={arreter}
      onPointerCancel={arreter}
    >
      {libelle}
    </button>
  );

  return (
    <div className="Tetris">
      <div className="Tetris__jeu">
        <div ref={cadreRef} className="Tetris__cadre">
          <canvas ref={canvasRef} className="Tetris__canvas" />
        </div>

        <aside className="Tetris__infos">
          <div className="Tetris__apercu">
            <p className="Tetris__etiquette">Ensuite</p>
            <canvas ref={apercuRef} className="Tetris__apercuCanvas" />
          </div>
          <dl className="Tetris__compteurs">
            <div>
              <dt>Points</dt>
              <dd>{hud.score.toLocaleString('fr-FR')}</dd>
            </div>
            <div>
              <dt>Lignes</dt>
              <dd>{hud.lignes}</dd>
            </div>
            <div>
              <dt>Niveau</dt>
              <dd>{hud.niveau}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="Tetris__pause"
            onClick={basculerPause}
          >
            {hud.pause ? 'Reprendre' : 'Pause'}
          </button>
        </aside>
      </div>

      <div className="Tetris__commandes">
        {fleche('◀', 'À gauche', () => glisser(-1))}
        {fleche('↻', 'Tourner', () => pivoter(1))}
        {fleche('▼', 'Descendre', () => descendre())}
        {fleche('▶', 'À droite', () => glisser(1))}
        <button
          type="button"
          className="Tetris__bouton Tetris__bouton--poser"
          onPointerDown={(evenement) => {
            evenement.preventDefault();
            lacher();
          }}
        >
          Poser
        </button>
      </div>
    </div>
  );
}
