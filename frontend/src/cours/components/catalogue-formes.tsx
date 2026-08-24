import type { ReactNode } from 'react';

/**
 * Le catalogue des figures géométriques du CE1, en SVG.
 *
 * Pourquoi les dessiner plutôt que reprendre les images du corpus : celles-ci sont des
 * captures matricielles à encre foncée, de tailles et de styles hétérogènes, et posées sur
 * la feuille de cahier elles jurent. Un tracé SVG suit l'encre de la fiche, reste net à
 * n'importe quelle taille, et surtout permet de MARQUER ce qui compte (l'angle droit, les
 * côtés égaux, l'axe) au lieu de laisser l'enfant deviner ce qu'il faut regarder.
 *
 * Toutes les figures partagent un cadre de 100 × 100 et `currentColor`, donc elles se
 * ressemblent et suivent la couleur du texte. Les marques (angle droit, égalité) sont dans
 * la couleur d'accent : ce sont des annotations, pas des traits de la figure.
 */

const TRAIT = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.5 } as const;
const MARQUE = { fill: 'none', stroke: 'var(--fiche-accent)', strokeWidth: 2 } as const;
const CONSTRUCTION = { ...TRAIT, strokeWidth: 1.5, strokeDasharray: '4 3' } as const;

/** Le petit carré qui signale un angle droit, orienté par les deux directions du coin. */
function angleDroit(x: number, y: number, dx: number, dy: number, taille = 9) {
  return (
    <path
      {...MARQUE}
      d={`M ${x + dx * taille} ${y} L ${x + dx * taille} ${y + dy * taille} L ${x} ${y + dy * taille}`}
    />
  );
}

/** Le trait qui marque deux côtés de même longueur. */
function egal(x: number, y: number, vertical: boolean) {
  return vertical ? (
    <line {...MARQUE} x1={x - 5} y1={y} x2={x + 5} y2={y} />
  ) : (
    <line {...MARQUE} x1={x} y1={y - 5} x2={x} y2={y + 5} />
  );
}

// Pas d'annotation `Record<string, ReactNode>` : elle élargirait les clés à `string`, et
// un nom de forme mal orthographié dans une fiche passerait le typage pour ne rendre
// qu'un cadre vide. `satisfies` vérifie la forme des valeurs en gardant les clés
// littérales, donc `keyof typeof FORMES` refuse le nom inconnu.
export const FORMES = {
  // ── Lignes ────────────────────────────────────────────────────────────────
  droite: (
    <>
      <line {...TRAIT} x1={2} y1={50} x2={98} y2={50} />
      <text x={50} y={38} className="Forme__note">elle continue sans fin</text>
    </>
  ),

  segment: (
    <>
      <line {...TRAIT} x1={18} y1={50} x2={82} y2={50} />
      <circle cx={18} cy={50} r={4} fill="currentColor" />
      <circle cx={82} cy={50} r={4} fill="currentColor" />
      <text x={18} y={38} className="Forme__note">A</text>
      <text x={82} y={38} className="Forme__note">B</text>
    </>
  ),

  milieu: (
    <>
      <line {...TRAIT} x1={18} y1={50} x2={82} y2={50} />
      <circle cx={18} cy={50} r={4} fill="currentColor" />
      <circle cx={82} cy={50} r={4} fill="currentColor" />
      <circle cx={50} cy={50} r={4} fill="var(--fiche-accent)" />
      {egal(34, 50, false)}
      {egal(66, 50, false)}
      <text x={50} y={38} className="Forme__note">le milieu</text>
    </>
  ),

  // ── Figures planes ────────────────────────────────────────────────────────
  carre: (
    <>
      <rect {...TRAIT} x={22} y={22} width={56} height={56} />
      {angleDroit(22, 22, 1, 1)}
      {egal(50, 22, false)}
      {egal(50, 78, false)}
      {egal(22, 50, true)}
      {egal(78, 50, true)}
    </>
  ),

  rectangle: (
    <>
      <rect {...TRAIT} x={10} y={30} width={80} height={40} />
      {angleDroit(10, 30, 1, 1)}
      {angleDroit(90, 70, -1, -1)}
      <text x={50} y={22} className="Forme__note">la longueur</text>
    </>
  ),

  triangle: (
    <>
      <polygon {...TRAIT} points="50,18 86,82 14,82" />
      <circle cx={50} cy={18} r={3.5} fill="currentColor" />
      <circle cx={86} cy={82} r={3.5} fill="currentColor" />
      <circle cx={14} cy={82} r={3.5} fill="currentColor" />
    </>
  ),

  triangleRectangle: (
    <>
      <polygon {...TRAIT} points="18,18 18,82 84,82" />
      {angleDroit(18, 82, 1, -1)}
    </>
  ),

  cercle: (
    <>
      <circle {...TRAIT} cx={50} cy={52} r={34} />
      <line {...CONSTRUCTION} x1={50} y1={52} x2={84} y2={52} />
      <circle cx={50} cy={52} r={3.5} fill="var(--fiche-accent)" />
      <text x={50} y={38} className="Forme__note">le centre</text>
    </>
  ),

  // ── Symétrie ──────────────────────────────────────────────────────────────
  symetrie: (
    <>
      <polygon {...TRAIT} points="44,20 14,50 44,80" />
      <polygon {...TRAIT} points="56,20 86,50 56,80" />
      <line {...MARQUE} x1={50} y1={8} x2={50} y2={92} strokeDasharray="5 4" />
      <text x={50} y={100} className="Forme__note">l&apos;axe</text>
    </>
  ),

  sansSymetrie: (
    <>
      <polygon {...TRAIT} points="20,72 42,20 80,40 62,80" />
      <text x={50} y={96} className="Forme__note">aucun axe</text>
    </>
  ),

  // ── Solides ───────────────────────────────────────────────────────────────
  cube: (
    <>
      <rect {...TRAIT} x={18} y={34} width={48} height={48} />
      <polyline {...CONSTRUCTION} points="18,34 36,16 84,16 84,64 66,82" />
      <line {...CONSTRUCTION} x1={66} y1={34} x2={84} y2={16} />
      <line {...CONSTRUCTION} x1={66} y1={34} x2={84} y2={64} />
    </>
  ),

  pave: (
    <>
      <rect {...TRAIT} x={14} y={38} width={62} height={40} />
      <polyline {...CONSTRUCTION} points="14,38 32,20 94,20 94,60 76,78" />
      <line {...CONSTRUCTION} x1={76} y1={38} x2={94} y2={20} />
      <line {...CONSTRUCTION} x1={76} y1={38} x2={94} y2={60} />
    </>
  ),

  pyramide: (
    <>
      <polygon {...TRAIT} points="50,12 16,74 68,74" />
      <line {...TRAIT} x1={68} y1={74} x2={90} y2={54} />
      <line {...TRAIT} x1={50} y1={12} x2={90} y2={54} />
      <line {...CONSTRUCTION} x1={16} y1={74} x2={38} y2={54} />
      <line {...CONSTRUCTION} x1={38} y1={54} x2={90} y2={54} />
    </>
  ),

  cone: (
    <>
      <ellipse {...TRAIT} cx={50} cy={74} rx={34} ry={12} />
      <line {...TRAIT} x1={16} y1={74} x2={50} y2={12} />
      <line {...TRAIT} x1={84} y1={74} x2={50} y2={12} />
    </>
  ),

  // ── Quadrillage ───────────────────────────────────────────────────────────
  quadrillage: (
    <>
      {[0, 1, 2, 3].map((i) => (
        <line key={`v${i}`} {...CONSTRUCTION} strokeDasharray="none" x1={22 + i * 22} y1={20} x2={22 + i * 22} y2={86} />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <line key={`h${i}`} {...CONSTRUCTION} strokeDasharray="none" x1={22} y1={20 + i * 22} x2={88} y2={20 + i * 22} />
      ))}
      <rect x={44} y={42} width={22} height={22} fill="var(--fiche-accent)" opacity={0.3} />
      {['A', 'B', 'C'].map((l, i) => (
        <text key={l} x={33 + i * 22} y={14} className="Forme__note">{l}</text>
      ))}
      {['1', '2', '3'].map((n, i) => (
        <text key={n} x={14} y={35 + i * 22} className="Forme__note">{n}</text>
      ))}
      <text x={55} y={98} className="Forme__note">la case B2</text>
    </>
  ),
} satisfies Record<string, ReactNode>;
