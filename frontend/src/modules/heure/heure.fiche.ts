import type { Fiche } from 'src/types/fiche.types';
import type { HeureQuestion } from './heure.type';

/**
 * Deux lectures d'un cadran, deux fiches différentes.
 *
 * En mode digital on lit les minutes telles quelles : « 3 heures 50 ». En mode expression
 * on les dit, et au-delà de la demie on annonce l'heure SUIVANTE en comptant à rebours :
 * 3h50 se dit « quatre heures moins dix ». C'est exactement la règle qui manque quand
 * l'enfant se trompe, et une fiche qui donne la lecture digitale n'apporte alors rien.
 */

const MINUTES_EN_MOTS: Record<number, string> = {
  5: 'cinq', 10: 'dix', 20: 'vingt', 25: 'vingt-cinq',
  35: 'vingt-cinq', 40: 'vingt', 50: 'dix', 55: 'cinq',
};

function heure12(hour: number): number {
  return hour % 12 === 0 ? 12 : hour % 12;
}

/** L'heure telle qu'on la DIT. Renvoie aussi de quoi expliquer le calcul à rebours. */
export function lireEnExpression(hour: number, minute: number): {
  dite: string;
  apresLaDemie: boolean;
  heureAnnoncee: number;
  restant: number;
} {
  const apresLaDemie = minute > 30;
  const heureAnnoncee = apresLaDemie ? (heure12(hour) % 12) + 1 : heure12(hour);
  const restant = 60 - minute;

  let suffixe: string;
  if (minute === 0) suffixe = 'pile';
  else if (minute === 15) suffixe = 'et quart';
  else if (minute === 30) suffixe = 'et demie';
  else if (minute === 45) suffixe = 'moins le quart';
  else if (apresLaDemie) suffixe = `moins ${MINUTES_EN_MOTS[minute] ?? restant}`;
  else suffixe = MINUTES_EN_MOTS[minute] ?? String(minute);

  // « 1 heure » au singulier : la fiche ne doit pas afficher une faute d'accord.
  const mot = heureAnnoncee === 1 ? 'heure' : 'heures';
  return { dite: `${heureAnnoncee} ${mot} ${suffixe}`, apresLaDemie, heureAnnoncee, restant };
}

export function heureFiche(question: HeureQuestion): Fiche {
  const { hour, minute } = question;
  const titre = `${hour}h${String(minute).padStart(2, '0')}`;
  const moment = hour < 12 ? 'du matin' : "de l'après-midi";

  if (question.questionMode === 'expression') {
    const { dite, apresLaDemie, heureAnnoncee, restant } = lireEnExpression(hour, minute);

    return {
      titre,
      idee: apresLaDemie
        ? "Passé la demie, on annonce l'heure d'après et on compte ce qu'il reste pour l'atteindre."
        : "Avant la demie, on donne l'heure puis les minutes écoulées.",
      regle: apresLaDemie
        ? [
            `${minute} min passées, il reste ${restant} min`,
            `avant ${heureAnnoncee} ${heureAnnoncee === 1 ? 'heure' : 'heures'}`,
            `donc : ${dite}`,
          ]
        : [dite],
      piege: apresLaDemie
        ? `L'heure dite n'est pas celle de la petite aiguille : à ${titre} on annonce ${heureAnnoncee}, pas ${heure12(hour)}.`
        : undefined,
    };
  }

  // Mode digital : on lit les minutes telles qu'elles sont.
  return {
    titre,
    idee: minute % 5 === 0
      ? "La petite aiguille donne l'heure, la grande donne les minutes. Chaque grand trait du cadran vaut 5 minutes."
      : "La petite aiguille donne l'heure, la grande donne les minutes. Compte les grands traits de 5 en 5, puis les petits un par un.",
    regle: [`${heure12(hour)} ${heure12(hour) === 1 ? 'heure' : 'heures'} ${minute} ${moment}`],
    piege: hour >= 13
      ? `Après midi, ${hour} heures se dit aussi « ${heure12(hour)} heures ${moment} ».`
      : undefined,
  };
}
