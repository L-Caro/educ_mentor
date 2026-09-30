import { CleDeFa, CleDeSol, LARGEUR_FA, LARGEUR_SOL } from './clefs';
import type { Cle, Figure } from './solfege';
import { FIGURES, lignesSupplementaires } from './solfege';
import './portee.scss';

/**
 * Le dessin de la portée, en SVG, à la main.
 *
 * ── Pourquoi pas une bibliothèque de gravure ─────────────────────────────────────────
 *
 * Une portée de première année, ce sont cinq traits et des ovales. Les bibliothèques de
 * gravure musicale savent mettre en page une partition d'orchestre : elles pèsent, elles
 * s'habillent mal, et il faut le MÊME dessin à l'écran et sur le papier, où l'on n'a ni
 * police ni fond de couleur. Un SVG tracé ici sert les deux.
 *
 * ── L'unité ──────────────────────────────────────────────────────────────────────────
 *
 * Tout se mesure en INTERLIGNES, l'écart entre deux lignes de la portée, qui vaut dix.
 * Une position de note vaut un demi-interligne, donc cinq. La ligne du bas est en bas,
 * les y descendent quand la note monte : c'est l'inverse de la musique et la convention
 * du SVG, et c'est la seule conversion du fichier.
 */

const INTERLIGNE = 10;
const DEMI = INTERLIGNE / 2;
/** La hauteur de la portée elle-même : quatre interlignes entre cinq lignes. */
const HAUTEUR_PORTEE = 4 * INTERLIGNE;
/** Ce qu'on laisse respirer au-dessus et en dessous, pour les lignes supplémentaires,
 * les queues et les crochets. */
const MARGE = 5 * INTERLIGNE;

/** La place réservée à la clé, plus une respiration avant la première note. */
const LARGEURS_CLE: Record<Cle, number> = {
  sol: LARGEUR_SOL + 10,
  fa: LARGEUR_FA + 10,
  percussion: 26,
  rythme: 8,
};
const ESPACE_DEFAUT = 34;

/** La hauteur en SVG d'une position de portée. Position 0 = ligne du bas. */
function yDe(position: number): number {
  return MARGE + HAUTEUR_PORTEE - position * DEMI;
}

export interface Symbole {
  /** Où sur la portée, en demi-interlignes depuis la ligne du bas. */
  position: number;
  figure: Figure;
  /** Un silence : il occupe le temps sans sonner, et se dessine tout autrement. */
  silence?: boolean;
  /** Une croix plutôt qu'un ovale : les cymbales, à la batterie. */
  croix?: boolean;
  /** Forcer le sens de la queue. À la batterie, les MAINS vont vers le haut et les
   * PIEDS vers le bas, quelle que soit la hauteur : c'est ce qui permet de lire d'un
   * coup d'œil ce qui se joue avec les baguettes et ce qui se joue au pied. */
  queue?: 'haut' | 'bas';
  /** La note sur laquelle porte la question. */
  cible?: boolean;
  /** Déjà répondue, juste ou fausse : pour la lecture suivie. */
  verdict?: 'juste' | 'faux';
  /** Ce qui se prononce sous la note : « Taé », « aé », « Aé ». */
  syllabe?: string;
}

interface Props {
  cle: Cle;
  symboles: Symbole[];
  /** Rend la position visée quand on touche la portée. Absent, rien ne réagit. */
  onPosition?: (position: number) => void;
  /** Les positions qu'on accepte de désigner, bornes comprises. */
  etendue?: [number, number];
  /** L'écart entre deux symboles. Plus large quand ils sont rares et gros. */
  espace?: number;
  /** Une barre de mesure après ces index (0 = après le premier symbole). */
  barres?: number[];
  /**
   * Ce qui s'écrit SOUS chaque emplacement : un mot, ou `null` pour un trait à remplir.
   *
   * Dessiné dans le SVG et non à côté, parce que c'est la seule façon de garantir
   * l'alignement. Une rangée de traits posée sous la portée en HTML se répartit
   * régulièrement, alors que les notes, elles, sont à leur place à elles : sur une feuille
   * imprimée, on ne sait alors plus quel trait va avec quelle note.
   */
  sous?: (string | null)[];
  /** Le nombre d'emplacements, quand il ne vient pas des symboles : une portée VIDE sur
   * laquelle il faut dessiner garde des places, sinon rien ne dit où écrire. */
  emplacements?: number;
}

// ─── Les clés ────────────────────────────────────────────────────────────────

/** La clé de percussion ne dit aucune hauteur : une batterie n'a pas de notes, elle a
 * des fûts. Deux barres épaisses, et c'est tout ce qu'elle a jamais dit. */
function CleDePercussion() {
  return (
    <>
      <rect
        className="Portee__barrePerc"
        x={4}
        y={yDe(7)}
        width={5}
        height={3 * INTERLIGNE}
      />
      <rect
        className="Portee__barrePerc"
        x={13}
        y={yDe(7)}
        width={5}
        height={3 * INTERLIGNE}
      />
    </>
  );
}

// ─── Les figures ─────────────────────────────────────────────────────────────

/** La tête : pleine à partir de la noire, évidée pour la blanche et la ronde. C'est le
 * premier coup d'œil qui donne la durée, avant même de regarder la queue. */
function Tete({
  x,
  y,
  figure,
  croix,
}: {
  x: number;
  y: number;
  figure: Figure;
  croix?: boolean;
}) {
  if (croix) {
    const c = 4.2;
    return (
      <g className="Portee__croix">
        <line x1={x - c} y1={y - c} x2={x + c} y2={y + c} />
        <line x1={x - c} y1={y + c} x2={x + c} y2={y - c} />
      </g>
    );
  }
  const pleine = figure !== 'ronde' && figure !== 'blanche';
  return (
    <ellipse
      className={`Portee__tete${pleine ? ' Portee__tete--pleine' : ''}`}
      cx={x}
      cy={y}
      rx={figure === 'ronde' ? 6.6 : 5.9}
      ry={4.4}
      transform={`rotate(-20 ${x} ${y})`}
    />
  );
}

/**
 * La queue, et ses crochets.
 *
 * Elle monte à droite quand la note est basse, descend à gauche quand la note est haute :
 * c'est la règle d'écriture, et elle a une raison très terre à terre, garder la queue
 * dans la page. Le partage se fait à la ligne du milieu.
 */
function Queue({
  x,
  position,
  figure,
  sens,
}: {
  x: number;
  position: number;
  figure: Figure;
  sens?: 'haut' | 'bas';
}) {
  if (figure === 'ronde') return null;
  const versLeHaut = sens ? sens === 'haut' : position < 4;
  const y = yDe(position);
  const longueur = 3.5 * INTERLIGNE;
  const xq = versLeHaut ? x + 5.4 : x - 5.4;
  const yq = versLeHaut ? y - longueur : y + longueur;
  const crochets = FIGURES[figure].crochets;

  return (
    <>
      <line className="Portee__queue" x1={xq} y1={y} x2={xq} y2={yq} />
      {Array.from({ length: crochets }, (_, i) => {
        const depart = yq + (versLeHaut ? i * 8 : -i * 8);
        return (
          <path
            key={i}
            className="Portee__crochet"
            d={
              versLeHaut
                ? `M ${xq} ${depart} C ${xq + 10} ${depart + 4} ${xq + 11} ${depart + 12} ${xq + 6} ${depart + 17}`
                : `M ${xq} ${depart} C ${xq + 10} ${depart - 4} ${xq + 11} ${depart - 12} ${xq + 6} ${depart - 17}`
            }
          />
        );
      })}
    </>
  );
}

/**
 * Les silences, un dessin par durée.
 *
 * La pause et la demi-pause sont le même petit rectangle, et seul le CÔTÉ de la ligne les
 * distingue : la pause pend sous la quatrième ligne, la demi-pause est posée sur la
 * troisième. C'est la confusion la plus courante, et elle ne se règle qu'en les voyant
 * côte à côte.
 */
function Silence({ x, figure }: { x: number; figure: Figure }) {
  if (figure === 'ronde') {
    return (
      <rect
        className="Portee__pause"
        x={x - 6}
        y={yDe(6)}
        width={12}
        height={DEMI}
      />
    );
  }
  if (figure === 'blanche') {
    return (
      <rect
        className="Portee__pause"
        x={x - 6}
        y={yDe(4) - DEMI}
        width={12}
        height={DEMI}
      />
    );
  }
  if (figure === 'noire') {
    const haut = yDe(7);
    return (
      <path
        className="Portee__soupir"
        d={`
          M ${x - 4} ${haut}
          C ${x + 2} ${haut + 7} ${x + 3} ${haut + 10} ${x - 2} ${haut + 15}
          C ${x + 3} ${haut + 13} ${x + 5} ${haut + 17} ${x + 1} ${haut + 22}
          C ${x - 4} ${haut + 27} ${x - 2} ${haut + 31} ${x + 4} ${haut + 33}
          C ${x - 3} ${haut + 32} ${x - 6} ${haut + 27} ${x - 2} ${haut + 22}
          C ${x + 2} ${haut + 17} ${x + 1} ${haut + 13} ${x - 5} ${haut + 10}
          Z
        `}
      />
    );
  }
  // Demi-soupir et quart de soupir : une hampe oblique, et un petit crochet par degré de
  // division. Un crochet, c'est la moitié d'un temps ; deux, le quart.
  const crochets = FIGURES[figure].crochets;
  const haut = yDe(6);
  return (
    <>
      <line
        className="Portee__queue"
        x1={x + 4}
        y1={haut}
        x2={x - 4}
        y2={haut + 10 * crochets + 12}
      />
      {Array.from({ length: crochets }, (_, i) => {
        const cy = haut + i * 10;
        return (
          <g key={i}>
            <circle
              className="Portee__tete Portee__tete--pleine"
              cx={x - 1}
              cy={cy + 2}
              r={2.6}
            />
            <path
              className="Portee__crochet"
              d={`M ${x - 1} ${cy + 2} C ${x + 3} ${cy - 2} ${x + 5} ${cy - 2} ${x + 5} ${cy}`}
            />
          </g>
        );
      })}
    </>
  );
}

// ─── La portée ───────────────────────────────────────────────────────────────

/**
 * Jusqu'où le dessin monte et descend, en positions de portée.
 *
 * Calculé plutôt que fixé une fois pour toutes. Une marge généreuse et constante coûtait
 * les trois quarts du cadre : à l'écran, l'image entière étant mise à l'échelle, une
 * portée d'une seule note se retrouvait haute de cinquante pixels au milieu d'un grand
 * vide. On mesure donc ce qui est vraiment tracé, clé et queues comprises, et le cadre
 * s'y colle.
 */
function cadrer(
  cle: Cle,
  symboles: Symbole[],
  hauteur: number,
  avecSous: boolean,
): { y: number; hauteur: number } {
  // Ce que la clé déborde d'elle-même, au-dessus et en dessous de la portée.
  // Ce que la clé déborde d'elle-même, au-dessus et en dessous de la portée. Mesuré sur
  // les dessins : la clé de sol descend d'une ligne et demie sous la portée et monte
  // d'autant au-dessus, la clé de fa tient presque entièrement dedans.
  const parCle: Record<Cle, [number, number]> = {
    sol: [-3, 11],
    fa: [0, 9],
    percussion: [1, 7],
    rythme: [4, 4],
  };
  let bas = Math.min(cle === 'rythme' ? 4 : 0, parCle[cle][0]);
  let haut = Math.max(cle === 'rythme' ? 4 : 8, parCle[cle][1]);

  for (const symbole of symboles) {
    bas = Math.min(bas, symbole.position);
    haut = Math.max(haut, symbole.position);
    if (symbole.silence) {
      // Un silence ne se dessine PAS à sa position : il a sa place à lui sur la portée,
      // la pause sous la quatrième ligne, le soupir en travers du milieu. Les oublier ici
      // les faisait sortir du cadre, et sur une portée d'une seule ligne il n'en restait
      // qu'un trait.
      bas = Math.min(bas, -1);
      haut = Math.max(haut, 7);
      if (symbole.syllabe) bas = Math.min(bas, -6);
      continue;
    }
    const versLeHaut = symbole.queue
      ? symbole.queue === 'haut'
      : cle === 'rythme'
        ? true
        : symbole.position < 4;
    // La queue fait trois interlignes et demi, soit sept positions.
    if (versLeHaut) haut = Math.max(haut, symbole.position + 7);
    else bas = Math.min(bas, symbole.position - 7);
    if (symbole.syllabe) bas = Math.min(bas, -6);
  }

  // La rangée du dessous descend plus bas que tout le reste.
  if (avecSous) bas = Math.min(bas, -9);

  const y = yDe(haut) - 4;
  const dessous = yDe(bas) + 4;
  // Jamais plus que le cadre entier : au-delà, on rognerait ce qui est tracé.
  return {
    y: Math.max(0, y),
    hauteur: Math.min(hauteur - Math.max(0, y), dessous - y),
  };
}

export default function Portee({
  cle,
  symboles,
  onPosition,
  etendue = [-4, 12],
  espace = ESPACE_DEFAUT,
  barres = [],
  sous,
  emplacements,
}: Props) {
  const largeurCle = LARGEURS_CLE[cle];
  const places = Math.max(
    1,
    emplacements ?? symboles.length,
    sous?.length ?? 0,
  );
  const largeur = largeurCle + places * espace + 16;
  const hauteur = HAUTEUR_PORTEE + 2 * MARGE;
  const cadre = cadrer(cle, symboles, hauteur, sous !== undefined);

  /** La position visée par un clic, arrondie au demi-interligne le plus proche. */
  function positionVisee(evenement: React.MouseEvent<SVGRectElement>): number {
    const boite = evenement.currentTarget.getBoundingClientRect();
    const yLocal = ((evenement.clientY - boite.top) / boite.height) * hauteur;
    const brute = Math.round((MARGE + HAUTEUR_PORTEE - yLocal) / DEMI);
    return Math.min(etendue[1], Math.max(etendue[0], brute));
  }

  return (
    <svg
      className="Portee"
      viewBox={`0 ${cadre.y} ${largeur} ${cadre.hauteur}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      // Bornée en largeur, proportionnellement à ce qu'il y a à montrer. Sans cela une
      // portée d'un seul symbole s'étire sur toute la place disponible, et comme le
      // dessin garde ses proportions, la note devient énorme et la portée déborde.
      // Deux virgule six pixels par unité, soit un interligne de vingt-six pixels : la
      // taille d'une portée de cahier.
      style={{ maxWidth: `${String(Math.round(largeur * 2.6))}px` }}
    >
      {/* Les lignes. Elles courent sur toute la largeur, clé comprise : une portée qui
          commencerait après la clé aurait l'air coupée. La lecture rythmique n'en a
          qu'UNE : il n'y a pas de hauteur à lire, et cinq lignes suggéreraient des notes
          qui n'existent pas. */}
      {(cle === 'rythme' ? [4] : [0, 2, 4, 6, 8]).map((p) => (
        <line
          key={p}
          className="Portee__ligne"
          x1={0}
          y1={yDe(p)}
          x2={largeur}
          y2={yDe(p)}
        />
      ))}

      {/* La clé se pose sur SON repère : la deuxième ligne pour le sol, la quatrième
          pour le fa. C'est cela qui donne son nom à chaque ligne, et une clé posée à
          quelques pixels près enseignerait de fausses notes. */}
      {cle === 'sol' && <CleDeSol ligne={yDe(2)} />}
      {cle === 'fa' && <CleDeFa ligne={yDe(6)} />}
      {cle === 'percussion' && <CleDePercussion />}

      {symboles.map((symbole, index) => {
        const x = largeurCle + index * espace + espace / 2;
        const y = yDe(symbole.position);
        return (
          <g
            key={index}
            className={`Portee__symbole${symbole.cible ? ' Portee__symbole--cible' : ''}${
              symbole.verdict ? ` Portee__symbole--${symbole.verdict}` : ''
            }`}
          >
            {symbole.silence ? (
              <Silence x={x} figure={symbole.figure} />
            ) : (
              <>
                {lignesSupplementaires(symbole.position).map((p) => (
                  <line
                    key={p}
                    className="Portee__ligne Portee__ligne--supplementaire"
                    x1={x - 9}
                    y1={yDe(p)}
                    x2={x + 9}
                    y2={yDe(p)}
                  />
                ))}
                <Tete
                  x={x}
                  y={y}
                  figure={symbole.figure}
                  croix={symbole.croix}
                />
                <Queue
                  x={x}
                  position={symbole.position}
                  figure={symbole.figure}
                  // En lecture rythmique, toutes les queues montent : la note n'a pas
                  // de hauteur, donc la règle du partage à la ligne du milieu n'a rien à
                  // partager, et son cahier les écrit toutes vers le haut.
                  sens={
                    symbole.queue ?? (cle === 'rythme' ? 'haut' : undefined)
                  }
                />
              </>
            )}
            {symbole.syllabe && (
              <text
                className="Portee__syllabe"
                x={x}
                y={yDe(0) + 26}
                textAnchor="middle"
              >
                {symbole.syllabe}
              </text>
            )}
          </g>
        );
      })}

      {/* La barre de mesure va d'une ligne à l'autre. Sur une portée d'une seule ligne,
          elle n'a rien à traverser : on la garde courte, sinon elle domine la page et
          ressemble à une queue de note égarée. */}
      {/* Les mots ou les traits du dessous, calés sur l'emplacement de chaque note. */}
      {sous?.map((texte, index) => {
        const x = largeurCle + index * espace + espace / 2;
        return texte === null ? (
          <line
            key={index}
            className="Portee__aRemplir"
            x1={x - espace * 0.36}
            y1={yDe(-7)}
            x2={x + espace * 0.36}
            y2={yDe(-7)}
          />
        ) : (
          <text
            key={index}
            className="Portee__syllabe"
            x={x}
            y={yDe(-7)}
            textAnchor="middle"
          >
            {texte}
          </text>
        );
      })}

      {barres.map((index) => (
        <line
          key={index}
          className="Portee__barre"
          x1={largeurCle + (index + 1) * espace}
          y1={yDe(cle === 'rythme' ? 6 : 8)}
          x2={largeurCle + (index + 1) * espace}
          y2={yDe(cle === 'rythme' ? 2 : 0)}
        />
      ))}

      {/* La zone sensible passe APRÈS tout le reste : dessinée avant, elle recouvrirait
          les notes et le clic tomberait à côté. Transparente, elle ne se voit pas. */}
      {onPosition && (
        <rect
          className="Portee__zone"
          x={largeurCle}
          y={0}
          width={largeur - largeurCle}
          height={hauteur}
          onClick={(evenement) => onPosition(positionVisee(evenement))}
        />
      )}
    </svg>
  );
}
