import type { ReactNode } from 'react';
import herbeUrl from './assets/village/herbe.png';
import herbeDeuxUrl from './assets/village/herbe-2.png';
import arbreUrl from './assets/village/arbre.png';
import champignonUrl from './assets/village/champignon.png';
import cibleUrl from './assets/village/cible.png';
import persoNordUrl from './assets/village/perso-nord.png';
import persoEstUrl from './assets/village/perso-est.png';
import persoSudUrl from './assets/village/perso-sud.png';
import persoOuestUrl from './assets/village/perso-ouest.png';
import type { Direction } from './programmation.types';

/**
 * Les themes : un decor, un personnage, un but, une chose a ramasser.
 *
 * Dessines en SVG, dans le style du reste du projet : contour noir epais, aplats vifs,
 * comme les sprites du snake. Un trace reste net a toute taille, ce qui compte ici
 * puisque la grille va de cinq a huit cases de cote, et il n'entraine aucune licence a
 * suivre dans `ATTRIBUTIONS.md`.
 *
 * Le personnage est dessine tourne vers l'EST, et une rotation CSS l'oriente. Quatre
 * dessins separes divergeraient a la premiere retouche, et il faudrait les refaire pour
 * chaque theme.
 *
 * Les traces sont des FONCTIONS qui rendent du JSX, nommees en minuscule, et non des
 * composants. C'est la convention de `catalogue-formes.tsx`, et elle n'est pas
 * cosmetique : un fichier qui definit des composants et exporte aussi autre chose perd le
 * rechargement a chaud, ce que le lint refuse a juste titre.
 */

export type ThemeKey = 'lapin' | 'abeille' | 'fusee' | 'robot' | 'village';

export interface Theme {
  cle: ThemeKey;
  label: string;
  /** Ce qu'on voit sur la tuile de fond. */
  sol: string;
  solAlterne: string;
  mur: ReactNode;
  /** Le personnage DEJA oriente.
   *
   * C'est une fonction de la direction, et non un dessin unique que la grille ferait
   * pivoter. Un trace vu strictement de dessus se contente d'une rotation ; un
   * personnage dessine de trois quarts, qu'on voit de face, de dos et de profil, a
   * quatre images distinctes. Laisser le choix au theme permet aux deux de coexister. */
  personnage: (direction: Direction) => ReactNode;
  but: ReactNode;
  graine: ReactNode;
  /** Les images en pixels s'agrandissent au carre, sans lissage : sans cela un sprite de
   * seize pixels etale sur cinq centimetres devient une bouillie floue. */
  pixels?: boolean;
  /** Comment nommer le but dans les phrases du jeu. */
  nomBut: string;
}

const TRAIT = {
  stroke: '#1a1a1a',
  strokeWidth: 3,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

/**
 * Le lapin, vu de dessus, tourne vers la droite.
 *
 * Les oreilles se dessinent APRES le corps. Posees avant, le corps les recouvrait et il
 * n'en restait que les pointes : le lapin etait une patate blanche, et c'est exactement
 * ce qu'on avait a l'ecran. L'interieur rose ne sert pas qu'a faire joli, il detache les
 * oreilles d'un pelage qui est de la meme couleur qu'elles.
 */
function lapin() {
  return (
    <g>
      <circle cx="26" cy="50" r="8" fill="#ffffff" {...TRAIT} />
      <ellipse cx="48" cy="50" rx="25" ry="19" fill="#ffffff" {...TRAIT} />
      <ellipse cx="44" cy="30" rx="6" ry="16" fill="#ffffff" {...TRAIT} transform="rotate(18 44 30)" />
      <ellipse cx="44" cy="30" rx="2.5" ry="10" fill="#f5a3b3" transform="rotate(18 44 30)" />
      <ellipse cx="44" cy="70" rx="6" ry="16" fill="#ffffff" {...TRAIT} transform="rotate(-18 44 70)" />
      <ellipse cx="44" cy="70" rx="2.5" ry="10" fill="#f5a3b3" transform="rotate(-18 44 70)" />
      <ellipse cx="68" cy="50" rx="13" ry="12" fill="#ffffff" {...TRAIT} />
      <circle cx="70" cy="44" r="3" fill="#1a1a1a" />
      <circle cx="70" cy="56" r="3" fill="#1a1a1a" />
      <ellipse cx="80" cy="50" rx="4.5" ry="3.5" fill="#f5a3b3" {...TRAIT} strokeWidth={2} />
    </g>
  );
}

function abeille() {
  return (
    <g>
      <ellipse cx="38" cy="36" rx="14" ry="9" fill="#dff1fb" {...TRAIT} strokeWidth={2.5} transform="rotate(-20 38 36)" />
      <ellipse cx="38" cy="64" rx="14" ry="9" fill="#dff1fb" {...TRAIT} strokeWidth={2.5} transform="rotate(20 38 64)" />
      <ellipse cx="50" cy="50" rx="27" ry="19" fill="#f7c948" {...TRAIT} />
      <path d="M44 32 v36" {...TRAIT} strokeWidth={7} />
      <path d="M58 33 v34" {...TRAIT} strokeWidth={7} />
      <circle cx="70" cy="44" r="3.5" fill="#1a1a1a" />
      <circle cx="70" cy="56" r="3.5" fill="#1a1a1a" />
      <path d="M24 44 l-9 -8 M24 56 l-9 8" {...TRAIT} strokeWidth={2.5} />
    </g>
  );
}

function fusee() {
  return (
    <g>
      <path d="M22 34 l14 16 -14 16 z" fill="#e8613c" {...TRAIT} />
      <path d="M22 40 h44 a22 10 0 0 1 0 20 h-44 a18 12 0 0 1 0 -20 z" fill="#f2f4f7" {...TRAIT} />
      <circle cx="62" cy="50" r="7" fill="#7fc4e8" {...TRAIT} strokeWidth={2.5} />
      <path d="M34 40 v20" {...TRAIT} strokeWidth={2.5} />
    </g>
  );
}

function robot() {
  return (
    <g>
      <path d="M50 22 v8" {...TRAIT} strokeWidth={3} />
      <circle cx="50" cy="20" r="5" fill="#e8613c" {...TRAIT} strokeWidth={2.5} />
      <rect x="24" y="30" width="20" height="40" rx="5" fill="#8a949f" {...TRAIT} />
      <rect x="30" y="30" width="44" height="40" rx="9" fill="#7fc4e8" {...TRAIT} />
      <rect x="56" y="38" width="22" height="24" rx="6" fill="#f2f4f7" {...TRAIT} strokeWidth={2.5} />
      <circle cx="66" cy="44" r="3.5" fill="#1a1a1a" />
      <circle cx="66" cy="56" r="3.5" fill="#1a1a1a" />
      <path d="M78 50 h8" {...TRAIT} strokeWidth={5} />
      <path d="M34 38 h12 M34 62 h12" {...TRAIT} strokeWidth={2.5} />
    </g>
  );
}

function carotte() {
  return (
    <g>
      <path d="M50 78 l-11 -34 h22 z" fill="#ef8c3a" {...TRAIT} />
      <path d="M50 44 q-14 -14 -4 -22 q8 -2 10 10" fill="#5fae4e" {...TRAIT} strokeWidth={2.5} />
      <path d="M52 44 q14 -12 6 -22 q-9 0 -10 12" fill="#5fae4e" {...TRAIT} strokeWidth={2.5} />
    </g>
  );
}

function fleur() {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="50" cy="32" rx="9" ry="14" fill="#f09ec4" {...TRAIT} strokeWidth={2.5} transform={`rotate(${String(angle)} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="10" fill="#f7c948" {...TRAIT} strokeWidth={2.5} />
    </g>
  );
}

function etoile() {
  return (
    <path
      d="M50 18 l10 22 24 3 -17 17 4 24 -21 -11 -21 11 4 -24 -17 -17 24 -3 z"
      fill="#f7c948"
      {...TRAIT}
    />
  );
}

function planete() {
  return (
    <g>
      <circle cx="50" cy="50" r="22" fill="#8e7ae0" {...TRAIT} />
      <ellipse cx="50" cy="50" rx="34" ry="10" fill="none" {...TRAIT} strokeWidth={4} transform="rotate(-18 50 50)" />
    </g>
  );
}

function pile() {
  return (
    <g>
      <rect x="34" y="26" width="32" height="48" rx="5" fill="#7fc98a" {...TRAIT} />
      <rect x="44" y="18" width="12" height="9" rx="2" fill="#7fc98a" {...TRAIT} strokeWidth={2.5} />
      <path d="M52 36 l-10 16 h9 l-3 12 12 -18 h-9 z" fill="#f7c948" {...TRAIT} strokeWidth={2} />
    </g>
  );
}

function rocher() {
  return (
    <path
      d="M18 76 l8 -30 16 -12 22 4 14 20 -4 18 z"
      fill="#9aa3ad"
      {...TRAIT}
    />
  );
}

function ruche() {
  return (
    <g>
      <rect x="20" y="30" width="60" height="46" rx="10" fill="#c99a5b" {...TRAIT} />
      <path d="M22 46 h56 M22 60 h56" {...TRAIT} strokeWidth={2.5} />
    </g>
  );
}

function meteore() {
  return (
    <g>
      <circle cx="50" cy="52" r="24" fill="#6b6f76" {...TRAIT} />
      <circle cx="42" cy="46" r="5" fill="#4e535a" />
      <circle cx="59" cy="59" r="6" fill="#4e535a" />
    </g>
  );
}

/** Un trace SVG, tourne vers la direction voulue. Les quatre orientations viennent d'une
 * seule image : un dessin vu strictement de dessus n'a pas de face cachee. */
function tourneSvg(trace: ReactNode) {
  return (direction: Direction) => (
    <g
      style={{
        transform: `rotate(${String(ANGLE[direction])}deg)`,
        transformOrigin: '50% 50%',
        transition: 'transform 0.25s ease',
      }}
    >
      {trace}
    </g>
  );
}

/**
 * Une image de tuile, posee dans le cadre de cent unites du plateau.
 *
 * `zoom` la fait deborder du cadre, centree. Les sprites de Kenney portent leur propre
 * marge : a l'echelle exacte de la case, le personnage n'en occupait que six dixiemes et
 * paraissait perdu au milieu de son herbe.
 */
function image(source: string, zoom = 1) {
  const cote = 100 * zoom;
  const bord = (100 - cote) / 2;
  return (
    <image href={source} x={bord} y={bord} width={cote} height={cote} />
  );
}

export const THEMES: Theme[] = [
  {
    cle: 'lapin',
    label: 'Le lapin et la carotte',
    sol: '#dff0c8',
    solAlterne: '#d3e9b8',
    mur: rocher(),
    personnage: tourneSvg(lapin()),
    but: carotte(),
    graine: fleur(),
    nomBut: 'la carotte',
  },
  {
    cle: 'abeille',
    label: 'L’abeille et la ruche',
    sol: '#fdf3d0',
    solAlterne: '#f9ecc0',
    mur: rocher(),
    personnage: tourneSvg(abeille()),
    but: ruche(),
    graine: fleur(),
    nomBut: 'la ruche',
  },
  {
    cle: 'fusee',
    label: 'La fusée et la planète',
    sol: '#dfe6f5',
    solAlterne: '#d3dcf0',
    mur: meteore(),
    personnage: tourneSvg(fusee()),
    but: planete(),
    graine: etoile(),
    nomBut: 'la planète',
  },
  {
    cle: 'robot',
    label: 'Le robot et sa pile',
    sol: '#e6e9ec',
    solAlterne: '#dcdfe3',
    mur: rocher(),
    personnage: tourneSvg(robot()),
    but: pile(),
    graine: etoile(),
    nomBut: 'la pile',
  },
  {
    // Le theme en PIXELS, avec les sprites de Kenney (domaine public). Le personnage y a
    // quatre dessins distincts, parce qu'il est vu de trois quarts : on voit son visage
    // quand il descend et son dos quand il monte. Un simple pivotement l'aurait couche
    // sur le cote.
    cle: 'village',
    label: 'Le village (pixels)',
    sol: '#8cc153',
    solAlterne: '#8cc153',
    // Un arbre ORANGE sur de l'herbe verte. Le sapin vert du meme jeu de tuiles se
    // fondait dans le sol : il n'en restait que le contour sombre, qu'on prenait pour une
    // arche. Un obstacle doit se voir avant d'etre compris.
    mur: image(arbreUrl),
    personnage: (direction) =>
      image(
        {
          nord: persoNordUrl,
          est: persoEstUrl,
          sud: persoSudUrl,
          ouest: persoOuestUrl,
        }[direction],
        1.3,
      ),
    // Une cible, et non la maison du meme jeu de tuiles : celle-ci n'en montre que le
    // toit, les maisons de Kenney tenant sur plusieurs cases. Un but qu'on prend pour un
    // rocher ne dit pas ou aller.
    but: image(cibleUrl, 1.15),
    graine: image(champignonUrl),
    nomBut: 'la cible',
    pixels: true,
  },
];

/** Les deux tuiles d'herbe du theme en pixels, pour que le sol ne soit pas un aplat. */
export const SOL_VILLAGE = { pair: herbeUrl, impair: herbeDeuxUrl };

export function theme(cle: string): Theme {
  return THEMES.find((t) => t.cle === cle) ?? THEMES[0];
}

/** L'angle a appliquer au personnage, qui est dessine vers l'EST. */
export const ANGLE: Record<Direction, number> = {
  est: 0,
  sud: 90,
  ouest: 180,
  nord: 270,
};
