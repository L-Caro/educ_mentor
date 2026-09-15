/**
 * La geometrie du cadran, partagee par l'ecran et le papier.
 *
 * Les deux rendus ne se ressemblent pas : celui du jeu suit le theme et fait vingt
 * centimetres, celui de la feuille est noir sur blanc et fait trois centimetres et demi.
 * Mais un cadran ou les chiffres ne tombent pas au meme endroit selon le support serait
 * un autre cadran, et c'est justement la position des aiguilles entre deux nombres que
 * l'exercice travaille. Seul le TRACE est ici ; l'habillage reste a chacun.
 */

export const ARABIC = [
  '12',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
];
export const ROMAN = [
  'XII',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
];

/** Le cadran est dessine dans un carre de 200, centre en (100, 100). */
export const CX = 100;
export const CY = 100;
export const FACE_R = 89;
export const TICK_OUT = 88;
export const TICK_H_IN = 77; // tick d'heure (11px)
export const TICK_M_IN = 83; // tick de minute (5px)
export const NUM_R = 71; // rayon des chiffres

/** x/y d'un point a <radius> du centre pour un angle horaire en degres (0 deg = 12h). */
export function clockPoint(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.sin(rad),
    y: CY - radius * Math.cos(rad),
  };
}

/** Les angles des deux aiguilles. La petite avance AVEC les minutes : a 3 h 45 elle est
 * presque sur le 4, et c'est exactement ce qui se lit mal quand on l'oublie. */
export function anglesAiguilles(hour: number, minute: number) {
  return {
    heure: (hour % 12) * 30 + minute * 0.5,
    minute: minute * 6,
  };
}
