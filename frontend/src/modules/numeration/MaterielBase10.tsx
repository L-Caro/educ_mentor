/**
 * Le materiel base 10 de l'ecole : cubes, batons, plaques.
 *
 * Quatre batons de dix cubes pour quarante. C'est la representation qu'elle manipule en
 * classe, et c'est toute la raison de la reprendre plutot que d'inventer mieux : le meme
 * dessin sur sa feuille et sur sa table lui permet de transporter ce qu'elle sait.
 *
 * En SVG, avec de vrais traits et de vrais remplissages. Un quadrillage en fond CSS ne
 * s'imprimerait pas : Chrome n'imprime pas les fonds tant que « Graphiques d'arriere-plan »
 * n'est pas coche, et cette case est decochee par defaut. Un `fill` de SVG, lui, est du
 * CONTENU : il sort toujours, couleur comprise.
 *
 * ── Une couleur par rang ─────────────────────────────────────────────────────────────
 *
 * C'est ainsi que le materiel se presente en classe, et c'est ce qui permet de compter
 * par paquets sans recompter les carreaux : la couleur dit le rang avant que l'oeil
 * n'ait compte. En noir et blanc il fallait mesurer chaque piece pour savoir si c'etait
 * une dizaine ou une centaine.
 *
 * Des teintes CLAIRES : le trait doit rester lisible par-dessus, et cent carreaux en
 * aplat sombre coutent une cartouche.
 *
 * Une unite fait 2 mm. Une plaque de cent en fait donc 20, et quatre plaques tiennent
 * dans une colonne de feuille. Au-dela on passe a la ligne.
 */
const U = 2; // millimetres par unite

/** La couleur de chaque rang. Reprises du materiel de classe : l'unite jaune, la dizaine
 * bleue, la centaine rouge, le millier vert. */
const TEINTE = {
  unite: '#f7dd8f',
  dizaine: '#9ec8ee',
  centaine: '#f2a6a6',
  millier: '#a9d8ab',
} as const;

function Grille({
  colonnes,
  lignes,
  teinte,
}: {
  colonnes: number;
  lignes: number;
  teinte: string;
}) {
  const l = colonnes * U;
  const h = lignes * U;
  return (
    <svg
      width={`${l}mm`}
      height={`${h}mm`}
      viewBox={`0 0 ${l} ${h}`}
      className="Base10__piece"
    >
      <rect
        x="0.15"
        y="0.15"
        width={l - 0.3}
        height={h - 0.3}
        style={{ fill: teinte }}
      />
      {Array.from({ length: colonnes - 1 }, (_, i) => (
        <line key={`v${i}`} x1={(i + 1) * U} y1="0" x2={(i + 1) * U} y2={h} />
      ))}
      {Array.from({ length: lignes - 1 }, (_, i) => (
        <line key={`h${i}`} x1="0" y1={(i + 1) * U} x2={l} y2={(i + 1) * U} />
      ))}
    </svg>
  );
}

export default function MaterielBase10({
  milliers,
  centaines,
  dizaines,
  unites,
}: {
  milliers: number;
  centaines: number;
  dizaines: number;
  unites: number;
}) {
  return (
    <span className="Base10">
      {/* Le millier est dessine comme une plaque marquee : un vrai cube en perspective
          demanderait un dessin en volume, illisible a cette taille et absent du materiel
          qu'elle manipule, qui est un empilement de plaques. */}
      {Array.from({ length: milliers }, (_, i) => (
        <span key={`m${i}`} className="Base10__millier">
          <Grille colonnes={10} lignes={10} teinte={TEINTE.millier} />
        </span>
      ))}
      {Array.from({ length: centaines }, (_, i) => (
        <Grille key={`c${i}`} colonnes={10} lignes={10} teinte={TEINTE.centaine} />
      ))}
      {Array.from({ length: dizaines }, (_, i) => (
        <Grille key={`d${i}`} colonnes={1} lignes={10} teinte={TEINTE.dizaine} />
      ))}
      {Array.from({ length: unites }, (_, i) => (
        <Grille key={`u${i}`} colonnes={1} lignes={1} teinte={TEINTE.unite} />
      ))}
    </span>
  );
}
