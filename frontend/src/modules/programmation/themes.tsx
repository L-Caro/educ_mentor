import type { ReactNode } from 'react';
import type { Direction } from './programmation.types';

/**
 * Les trois catalogues : qui joue, ou l'on va, et sur quoi l'on marche.
 *
 * Trois listes INDEPENDANTES plutot qu'un theme d'un bloc. Un theme fige des accords
 * qu'on n'a pas choisis : on aimait le lapin mais pas la banquise, et il fallait prendre
 * les deux. Separes, huit personnages, huit buts et six sols font des centaines de
 * combinaisons, et c'est elle qui compose la sienne.
 *
 * ── Tout est dessine ici, et tout TOURNE ─────────────────────────────────────────────
 *
 * Chaque personnage est vu strictement DE DESSUS, avec un avant reconnaissable : un
 * museau, une proue, un nez. C'est ce qui permet a une simple rotation de dire ou il va.
 *
 * L'essai precedent utilisait de belles tetes vues de face, qu'aucune rotation ne pouvait
 * orienter : il avait fallu poser une fleche a cote, et l'on se retrouvait avec un
 * personnage qui regarde a droite pendant qu'une fleche annonce la gauche. Dans un jeu
 * dont le sujet EST la direction, deux indications contradictoires ne sont pas un detail
 * de style : c'est l'exercice qu'on rend impossible.
 */

const T = {
  stroke: '#1a1a1a',
  strokeWidth: 3,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};
const F = { ...T, strokeWidth: 2.2 };

// ─── Personnages, tous tournes vers l'EST ────────────────────────────────────

function lapin() {
  return (
    <g>
      <circle cx="24" cy="50" r="8" fill="#fff" {...T} />
      <ellipse cx="48" cy="50" rx="25" ry="19" fill="#fff" {...T} />
      <ellipse cx="44" cy="30" rx="6" ry="16" fill="#fff" {...T} transform="rotate(18 44 30)" />
      <ellipse cx="44" cy="30" rx="2.5" ry="10" fill="#f5a3b3" transform="rotate(18 44 30)" />
      <ellipse cx="44" cy="70" rx="6" ry="16" fill="#fff" {...T} transform="rotate(-18 44 70)" />
      <ellipse cx="44" cy="70" rx="2.5" ry="10" fill="#f5a3b3" transform="rotate(-18 44 70)" />
      <ellipse cx="68" cy="50" rx="13" ry="12" fill="#fff" {...T} />
      <circle cx="70" cy="44" r="3" fill="#1a1a1a" />
      <circle cx="70" cy="56" r="3" fill="#1a1a1a" />
      <ellipse cx="80" cy="50" rx="4.5" ry="3.5" fill="#f5a3b3" {...F} />
    </g>
  );
}

function chat() {
  return (
    <g>
      <path d="M22 50 q-12 -10 -8 -18 q10 0 14 10" fill="#f0a04b" {...F} />
      <ellipse cx="46" cy="50" rx="24" ry="18" fill="#f0a04b" {...T} />
      <path d="M58 36 l-2 -14 12 8 z" fill="#f0a04b" {...F} />
      <path d="M58 64 l-2 14 12 -8 z" fill="#f0a04b" {...F} />
      <circle cx="70" cy="50" r="13" fill="#f7b968" {...T} />
      <circle cx="72" cy="45" r="2.8" fill="#1a1a1a" />
      <circle cx="72" cy="55" r="2.8" fill="#1a1a1a" />
      <path d="M81 50 l-4 -3 -4 3 z" fill="#e0685f" {...F} />
    </g>
  );
}

function tortue() {
  return (
    <g>
      <ellipse cx="30" cy="36" rx="7" ry="5" fill="#8fbf6a" {...F} />
      <ellipse cx="30" cy="64" rx="7" ry="5" fill="#8fbf6a" {...F} />
      <ellipse cx="62" cy="34" rx="7" ry="5" fill="#8fbf6a" {...F} />
      <ellipse cx="62" cy="66" rx="7" ry="5" fill="#8fbf6a" {...F} />
      <circle cx="48" cy="50" r="24" fill="#6aa84f" {...T} />
      <circle cx="48" cy="50" r="13" fill="#8fbf6a" {...F} />
      <path d="M48 27 v10 M48 63 v10 M25 50 h10 M61 50 h10" {...F} />
      <circle cx="78" cy="50" r="10" fill="#8fbf6a" {...T} />
      <circle cx="81" cy="46" r="2.5" fill="#1a1a1a" />
      <circle cx="81" cy="54" r="2.5" fill="#1a1a1a" />
    </g>
  );
}

function coccinelle() {
  return (
    <g>
      <path d="M40 30 l-10 -12 M40 70 l-10 12" {...F} />
      <ellipse cx="50" cy="50" rx="27" ry="22" fill="#d94f3d" {...T} />
      <path d="M50 28 v44" {...T} />
      <circle cx="40" cy="38" r="5" fill="#1a1a1a" />
      <circle cx="40" cy="62" r="5" fill="#1a1a1a" />
      <circle cx="58" cy="40" r="4" fill="#1a1a1a" />
      <circle cx="58" cy="60" r="4" fill="#1a1a1a" />
      <path d="M72 50 a14 14 0 0 0 -14 -14 h0 a14 14 0 0 0 0 28 h0 a14 14 0 0 0 14 -14 z" fill="#1a1a1a" {...T} />
      <circle cx="70" cy="44" r="2.5" fill="#fff" />
      <circle cx="70" cy="56" r="2.5" fill="#fff" />
    </g>
  );
}

function abeille() {
  return (
    <g>
      <ellipse cx="38" cy="34" rx="14" ry="9" fill="#dff1fb" {...F} transform="rotate(-20 38 34)" />
      <ellipse cx="38" cy="66" rx="14" ry="9" fill="#dff1fb" {...F} transform="rotate(20 38 66)" />
      <ellipse cx="50" cy="50" rx="27" ry="19" fill="#f7c948" {...T} />
      <path d="M44 32 v36" {...T} strokeWidth={7} />
      <path d="M58 33 v34" {...T} strokeWidth={7} />
      <circle cx="70" cy="44" r="3.5" fill="#1a1a1a" />
      <circle cx="70" cy="56" r="3.5" fill="#1a1a1a" />
      <path d="M24 44 l-9 -8 M24 56 l-9 8" {...F} />
    </g>
  );
}

function fusee() {
  return (
    <g>
      <path d="M22 34 l14 16 -14 16 z" fill="#e8613c" {...T} />
      <path d="M22 40 h44 a22 10 0 0 1 0 20 h-44 a18 12 0 0 1 0 -20 z" fill="#f2f4f7" {...T} />
      <circle cx="62" cy="50" r="7" fill="#7fc4e8" {...F} />
      <path d="M34 40 v20" {...F} />
    </g>
  );
}

function voiture() {
  return (
    <g>
      <rect x="26" y="26" width="14" height="10" rx="3" fill="#3b3b3b" {...F} />
      <rect x="26" y="64" width="14" height="10" rx="3" fill="#3b3b3b" {...F} />
      <rect x="58" y="26" width="14" height="10" rx="3" fill="#3b3b3b" {...F} />
      <rect x="58" y="64" width="14" height="10" rx="3" fill="#3b3b3b" {...F} />
      <rect x="20" y="32" width="60" height="36" rx="12" fill="#4a90d9" {...T} />
      <path d="M42 36 h20 a8 8 0 0 1 0 28 h-20 z" fill="#cfe6f7" {...F} />
      <circle cx="76" cy="40" r="3.5" fill="#f7e59b" {...F} />
      <circle cx="76" cy="60" r="3.5" fill="#f7e59b" {...F} />
    </g>
  );
}

function bateau() {
  return (
    <g>
      <path d="M20 32 h34 l26 18 -26 18 h-34 a10 18 0 0 1 0 -36 z" fill="#f2f4f7" {...T} />
      <rect x="30" y="40" width="22" height="20" rx="4" fill="#e8613c" {...F} />
      <circle cx="41" cy="50" r="4" fill="#7fc4e8" {...F} />
    </g>
  );
}

export interface Personnage {
  cle: string;
  label: string;
  trace: ReactNode;
}

export const PERSONNAGES: Personnage[] = [
  { cle: 'lapin', label: 'Le lapin', trace: lapin() },
  { cle: 'chat', label: 'Le chat', trace: chat() },
  { cle: 'tortue', label: 'La tortue', trace: tortue() },
  { cle: 'coccinelle', label: 'La coccinelle', trace: coccinelle() },
  { cle: 'abeille', label: 'L’abeille', trace: abeille() },
  { cle: 'fusee', label: 'La fusée', trace: fusee() },
  { cle: 'voiture', label: 'La voiture', trace: voiture() },
  { cle: 'bateau', label: 'Le bateau', trace: bateau() },
];

/** L'angle a appliquer : tous les traces regardent vers l'EST. */
export const ANGLE: Record<Direction, number> = {
  est: 0,
  sud: 90,
  ouest: 180,
  nord: 270,
};

// ─── Buts ────────────────────────────────────────────────────────────────────

function carotte() {
  return (
    <g>
      <path d="M50 80 l-12 -36 h24 z" fill="#ef8c3a" {...T} />
      <path d="M50 44 q-15 -15 -4 -24 q9 -2 11 11" fill="#5fae4e" {...F} />
      <path d="M53 44 q15 -13 6 -24 q-10 0 -11 13" fill="#5fae4e" {...F} />
    </g>
  );
}

function maison() {
  return (
    <g>
      <path d="M18 52 L50 24 L82 52 z" fill="#d94f3d" {...T} />
      <rect x="28" y="50" width="44" height="30" fill="#f6e0c0" {...T} />
      <rect x="43" y="60" width="14" height="20" fill="#9a6b3f" {...F} />
    </g>
  );
}

function coffre() {
  return (
    <g>
      <path d="M22 48 a28 22 0 0 1 56 0 z" fill="#c98b4b" {...T} />
      <rect x="22" y="48" width="56" height="28" rx="3" fill="#a9703a" {...T} />
      <rect x="44" y="44" width="12" height="16" rx="2" fill="#f7c948" {...F} />
    </g>
  );
}

function drapeau() {
  return (
    <g>
      <path d="M32 82 v-60" {...T} strokeWidth={5} />
      <path d="M34 26 l36 10 -36 10 z" fill="#d94f3d" {...T} />
    </g>
  );
}

function gateau() {
  return (
    <g>
      <path d="M50 16 v10" {...F} />
      <circle cx="50" cy="14" r="4" fill="#f7c948" {...F} />
      <rect x="24" y="40" width="52" height="16" rx="4" fill="#f5c6d6" {...T} />
      <rect x="24" y="54" width="52" height="24" rx="4" fill="#c98b4b" {...T} />
    </g>
  );
}

function poisson() {
  return (
    <g>
      <path d="M74 50 l16 -14 v28 z" fill="#f0a04b" {...T} />
      <ellipse cx="46" cy="50" rx="28" ry="18" fill="#f7b968" {...T} />
      <circle cx="30" cy="45" r="3.5" fill="#1a1a1a" />
      <path d="M50 36 q10 14 0 28" fill="none" {...F} />
    </g>
  );
}

function etoile() {
  return (
    <path
      d="M50 16 l11 24 26 3 -19 18 5 26 -23 -12 -23 12 5 -26 -19 -18 26 -3 z"
      fill="#f7c948"
      {...T}
    />
  );
}

function ruche() {
  return (
    <g>
      <rect x="20" y="28" width="60" height="48" rx="12" fill="#c99a5b" {...T} />
      <path d="M22 46 h56 M22 60 h56" {...F} />
      <circle cx="50" cy="68" r="5" fill="#8a5f34" {...F} />
    </g>
  );
}

export interface But {
  cle: string;
  label: string;
  /** Comment le nommer dans les phrases du jeu. */
  nom: string;
  trace: ReactNode;
}

export const BUTS: But[] = [
  { cle: 'carotte', label: 'Une carotte', nom: 'la carotte', trace: carotte() },
  { cle: 'maison', label: 'Une maison', nom: 'la maison', trace: maison() },
  { cle: 'coffre', label: 'Un trésor', nom: 'le trésor', trace: coffre() },
  { cle: 'drapeau', label: 'Un drapeau', nom: 'le drapeau', trace: drapeau() },
  { cle: 'gateau', label: 'Un gâteau', nom: 'le gâteau', trace: gateau() },
  { cle: 'poisson', label: 'Un poisson', nom: 'le poisson', trace: poisson() },
  { cle: 'etoile', label: 'Une étoile', nom: 'l’étoile', trace: etoile() },
  { cle: 'ruche', label: 'Une ruche', nom: 'la ruche', trace: ruche() },
];

// ─── Sols : la couleur, le motif, l'obstacle, ce qu'on ramasse ───────────────

function touffe(c: string) {
  return <path d="M30 76 l6 -16 5 16 M56 80 l7 -18 6 18" fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" />;
}
function cailloux(c: string) {
  return (
    <g fill={c}>
      <ellipse cx="32" cy="70" rx="9" ry="5" />
      <ellipse cx="66" cy="34" rx="7" ry="4" />
    </g>
  );
}
function vagues(c: string) {
  return <path d="M18 62 q10 -8 20 0 t20 0 t20 0" fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" />;
}
function etincelles(c: string) {
  return (
    <g fill={c}>
      <circle cx="30" cy="34" r="3.5" />
      <circle cx="68" cy="66" r="2.5" />
      <circle cx="54" cy="24" r="2" />
    </g>
  );
}

function rocher() {
  return <path d="M16 78 l8 -32 17 -13 23 4 15 21 -4 20 z" fill="#9aa3ad" {...T} />;
}
function buisson() {
  return (
    <g>
      <circle cx="36" cy="60" r="19" fill="#4f9440" {...T} />
      <circle cx="63" cy="57" r="21" fill="#5fae4e" {...T} />
    </g>
  );
}
function glacon() {
  return <path d="M24 76 l14 -38 14 -14 16 16 12 36 z" fill="#bfe4f5" {...T} />;
}
function cactus() {
  return (
    <g>
      <rect x="42" y="30" width="16" height="50" rx="8" fill="#5fae4e" {...T} />
      <path d="M42 50 h-12 v-12" fill="none" {...T} />
      <path d="M58 60 h12 v-14" fill="none" {...T} />
    </g>
  );
}
function meteore() {
  return (
    <g>
      <circle cx="50" cy="52" r="24" fill="#6b6f76" {...T} />
      <circle cx="42" cy="46" r="5" fill="#4e535a" />
      <circle cx="59" cy="59" r="6" fill="#4e535a" />
    </g>
  );
}

function fleur(petale: string) {
  return (
    <g>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="50" cy="32" rx="9" ry="14" fill={petale} {...F} transform={`rotate(${String(a)} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="10" fill="#f7c948" {...F} />
    </g>
  );
}
function coquillage() {
  return (
    <g>
      <path d="M50 74 a26 26 0 0 1 -26 -26 h52 a26 26 0 0 1 -26 26 z" fill="#f7d9c4" {...T} />
      <path d="M50 74 v-26 M36 60 l14 -12 M64 60 l-14 -12" fill="none" {...F} />
    </g>
  );
}
function cristal() {
  return <path d="M50 22 l16 22 -16 32 -16 -32 z" fill="#9fdcf5" {...T} />;
}
function gland() {
  return (
    <g>
      <ellipse cx="50" cy="58" rx="16" ry="20" fill="#c98b4b" {...T} />
      <path d="M32 44 a18 10 0 0 1 36 0 z" fill="#8a5f34" {...T} />
    </g>
  );
}

export interface Sol {
  cle: string;
  label: string;
  fond: string;
  fondAlterne: string;
  /** Le motif seme sur la case. Ce qui distingue vraiment deux terrains : deux aplats de
   * couleur font deux echiquiers, pas deux paysages. */
  motif: ReactNode;
  obstacle: ReactNode;
  /** Ce qu'on trouve par terre depend du terrain, pas du personnage. */
  graine: ReactNode;
}

export const SOLS: Sol[] = [
  {
    cle: 'pre',
    label: 'Un pré',
    fond: '#dff0c8',
    fondAlterne: '#d3e9b8',
    motif: touffe('#a9cf86'),
    obstacle: rocher(),
    graine: fleur('#f09ec4'),
  },
  {
    cle: 'foret',
    label: 'Une forêt',
    fond: '#c9e2b4',
    fondAlterne: '#bdd9a6',
    motif: touffe('#8ab36a'),
    obstacle: buisson(),
    graine: gland(),
  },
  {
    cle: 'plage',
    label: 'Une plage',
    fond: '#f7e7c4',
    fondAlterne: '#f1dfb4',
    motif: cailloux('#e0cba0'),
    obstacle: rocher(),
    graine: coquillage(),
  },
  {
    cle: 'desert',
    label: 'Un désert',
    fond: '#f6d9a8',
    fondAlterne: '#efcf98',
    motif: cailloux('#dbb87f'),
    obstacle: cactus(),
    graine: fleur('#f2a65a'),
  },
  {
    cle: 'banquise',
    label: 'La banquise',
    fond: '#dcecf7',
    fondAlterne: '#cfe4f2',
    motif: vagues('#bcd9ec'),
    obstacle: glacon(),
    graine: cristal(),
  },
  {
    cle: 'espace',
    label: 'L’espace',
    fond: '#2f3550',
    fondAlterne: '#363c59',
    motif: etincelles('#8a92bd'),
    obstacle: meteore(),
    graine: etoile(),
  },
];

export function personnage(cle: string): Personnage {
  return PERSONNAGES.find((p) => p.cle === cle) ?? PERSONNAGES[0];
}
export function but(cle: string): But {
  return BUTS.find((b) => b.cle === cle) ?? BUTS[0];
}
export function sol(cle: string): Sol {
  return SOLS.find((s) => s.cle === cle) ?? SOLS[0];
}
