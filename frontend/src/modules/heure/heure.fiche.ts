import type { Fiche } from 'src/types/fiche.types';
import type { HeureQuestion } from './heure.type';

/** Les repères du cadran que l'enfant apprend d'abord, avant de lire les minutes exactes. */
const REPERES: Record<number, string> = {
  0: 'pile',
  15: 'et quart',
  30: 'et demie',
  45: 'moins le quart',
};

export function heureFiche(question: HeureQuestion): Fiche {
  const { hour, minute } = question;
  const heure12 = hour % 12 === 0 ? 12 : hour % 12;
  const moment = hour < 12 ? 'du matin' : 'de l\'après-midi';
  const repere = REPERES[minute];

  // « moins le quart » se dit par rapport à l'heure SUIVANTE : 7h45 se lit « 8h moins le quart ».
  const heureDite = minute === 45 ? (heure12 % 12) + 1 : heure12;

  return {
    titre: `${hour}h${String(minute).padStart(2, '0')}`,
    idee: repere
      ? `La petite aiguille donne l'heure, la grande donne les minutes. À ${minute} minutes, on dit « ${heureDite} heures ${repere} ».`
      : "La petite aiguille donne l'heure, la grande donne les minutes. Chaque grand trait du cadran vaut 5 minutes : compte de 5 en 5.",
    regle: repere
      ? `${heureDite} heures ${repere} ${moment}`
      : `${heure12} heures ${minute} ${moment}`,
    piege: minute === 45
      ? "« Moins le quart » annonce l'heure d'après : à 7h45 on dit « 8 heures moins le quart »."
      : hour >= 13
        ? `Après midi, ${hour} heures se dit aussi « ${heure12} heures ${moment} ».`
        : undefined,
  };
}
