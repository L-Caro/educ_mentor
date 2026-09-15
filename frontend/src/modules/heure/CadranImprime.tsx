import {
  ARABIC,
  CX,
  CY,
  FACE_R,
  ROMAN,
  TICK_OUT,
  anglesAiguilles,
  clockPoint,
} from './heure.cadran';

/**
 * Les chiffres sont plus PRES du centre que sur l'ecran.
 *
 * Les angles sont les memes, et ce sont eux que l'exercice travaille ; le rayon, lui, se
 * negocie avec la taille reelle. A trois centimetres et demi les graduations d'heure
 * traversaient les chiffres, et un `IX` barre d'un trait ne se lit plus.
 */
const NUM_R_PAPIER = 64;

/** Les graduations sont plus COURTES que sur l'ecran, pour la meme raison : a cette
 * taille, une graduation d'heure de onze unites vient barrer le chiffre qu'elle designe.
 * Elles restent deux fois plus longues que celles des minutes, ce qui est leur role. */
const TICK_H_PAPIER = 80;
const TICK_M_PAPIER = 84;

interface CadranImprimeProps {
  heure: number;
  minute: number;
  chiffres: string;
  /** `true` matin, `false` apres-midi, absent quand la question ne va pas au-dela de
   * midi : un cadran ne distingue pas 15 h 20 de 3 h 20. */
  matin?: boolean;
  /** Un cadran NU, pour l'exercice ou l'enfant pose les aiguilles elle-meme. */
  sansAiguilles?: boolean;
}

/**
 * Le cadran sur le papier : noir sur blanc, et petit.
 *
 * Il ne reutilise pas `ClockFace` parce que celui-ci est habille par le theme et mesure
 * vingt centimetres. Ici il faut la meme geometrie, dans trois centimetres et demi, avec
 * un trace qui sorte d'une imprimante : ce sont deux habillages du meme dessin, et c'est
 * `heure.cadran.ts` qui tient le dessin.
 *
 * Tout est TRACE, jamais peint : les `fill` d'un SVG s'impriment, mais un fond CSS ne
 * s'imprime pas sans cocher « graphiques d'arriere-plan », que personne ne coche.
 */
export default function CadranImprime({
  heure,
  minute,
  chiffres,
  matin,
  sansAiguilles = false,
}: CadranImprimeProps) {
  const labels = chiffres === 'roman' ? ROMAN : ARABIC;
  const { heure: angleHeure, minute: angleMinute } = anglesAiguilles(
    heure,
    minute,
  );

  return (
    <div className="Cadran">
      <svg viewBox="0 0 200 200" className="Cadran__svg" aria-hidden="true">
        <circle cx={CX} cy={CY} r={FACE_R} className="Cadran__face" />

        {Array.from({ length: 60 }, (_, i) => {
          const estHeure = i % 5 === 0;
          const p1 = clockPoint(TICK_OUT, i * 6);
          const p2 = clockPoint(
            estHeure ? TICK_H_PAPIER : TICK_M_PAPIER,
            i * 6,
          );
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              className={`Cadran__tick${estHeure ? ' Cadran__tick--heure' : ''}`}
            />
          );
        })}

        {labels.map((label, i) => {
          const pos = clockPoint(NUM_R_PAPIER, i * 30);
          // Une seule taille pour tous les chiffres romains, calee sur le plus long
          // (`VIII`). Les mettre a la taille de leur largeur donnait un cadran ou `VIII`
          // etait visiblement plus petit que `XII` : cela se voit, et ne veut rien dire.
          return (
            <text
              key={label}
              x={pos.x}
              y={pos.y}
              className="Cadran__chiffre"
              fontSize={chiffres === 'roman' ? 10.5 : 14}
            >
              {label}
            </text>
          );
        })}

        {sansAiguilles ? (
          // Le centre reste marque : sans lui, les aiguilles partent d'ou l'enfant veut, et
          // l'exercice mesure le coup d'oeil plutot que la lecture de l'heure.
          <circle cx={CX} cy={CY} r={3} className="Cadran__centre" />
        ) : (
          <>
            <line
              x1={clockPoint(-9, angleHeure).x}
              y1={clockPoint(-9, angleHeure).y}
              x2={clockPoint(47, angleHeure).x}
              y2={clockPoint(47, angleHeure).y}
              className="Cadran__aiguille Cadran__aiguille--heure"
            />
            <line
              x1={clockPoint(-12, angleMinute).x}
              y1={clockPoint(-12, angleMinute).y}
              x2={clockPoint(67, angleMinute).x}
              y2={clockPoint(67, angleMinute).y}
              className="Cadran__aiguille Cadran__aiguille--minute"
            />
            <circle cx={CX} cy={CY} r={4} className="Cadran__centre" />
          </>
        )}
      </svg>
      {matin !== undefined && (
        // Des mots, pas un soleil et une lune : le jeu peut se permettre un emoji,
        // l'imprimante rend un carre vide des que la police ne le porte pas.
        <p className="Cadran__moment">{matin ? 'matin' : 'après-midi'}</p>
      )}
    </div>
  );
}
