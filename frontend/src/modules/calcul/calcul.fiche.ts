import type { Fiche } from 'src/types/fiche.types';
import type { CalculQuestion } from './calcul.type';

/**
 * Fiche dérivée de l'énoncé. Le backend n'envoie pas le type d'opération, seulement la
 * chaîne affichée : on le retrouve à sa forme, qui est stable et produite au même endroit
 * (`generateForType` dans calcul.service.ts). Un type non reconnu ne casse rien, il donne
 * une fiche générique plutôt qu'une fiche fausse.
 */

type Kind = 'complement' | 'addition' | 'soustraction' | 'double' | 'moitie';

/** Formes exactes produites par generateForType() côté serveur. Volontairement strictes :
 * un motif approximatif classait « ?? bizarre ?? » comme un complément et produisait une
 * fiche fausse. Mieux vaut ne rien reconnaître et retomber sur le générique. */
const PATTERNS: [Kind, RegExp][] = [
  ['double',       /^Double de \d+ = \?$/],
  ['moitie',       /^Moitié de \d+ = \?$/],
  ['complement',   /^(?:\d+ \+ \?|\? \+ \d+) = \d+$/],
  ['addition',     /^\d+ \+ \d+ = \?$/],
  ['soustraction', /^\d+ - \d+ = \?$/],
];

export function kindOf(operation: string): Kind | null {
  return PATTERNS.find(([, pattern]) => pattern.test(operation))?.[0] ?? null;
}

/** Le nombre de départ d'un « Double de N » ou « Moitié de N ». */
function leadingNumber(operation: string): number | null {
  const found = /(\d+)/.exec(operation);
  return found ? Number(found[1]) : null;
}

export function calculFiche(question: CalculQuestion): Fiche {
  const kind = kindOf(question.operation);
  const answer = question.answer;

  switch (kind) {
    case 'complement':
      return {
        titre: 'Compléter une addition',
        idee: "Cherche ce qui manque pour aller jusqu'au total. C'est une soustraction déguisée : le total moins le nombre connu.",
        regle: question.operation.replace('?', String(answer)),
        piege: "Ne réponds pas le total : on demande ce qu'il faut AJOUTER.",
      };

    case 'addition':
      return {
        titre: 'Additionner',
        idee: "Tu peux ajouter dans l'ordre que tu veux, le résultat ne change pas. Commence par le plus grand nombre, c'est plus rapide.",
        regle: question.operation.replace('?', String(answer)),
      };

    case 'soustraction':
      return {
        titre: 'Soustraire',
        idee: "Soustraire, c'est chercher l'écart entre deux nombres. Tu peux aussi compter en avançant depuis le plus petit.",
        regle: question.operation.replace('?', String(answer)),
        piege: "L'ordre compte : 10 moins 3 et 3 moins 10 ne donnent pas la même chose.",
      };

    case 'double': {
      const n = leadingNumber(question.operation);
      return {
        titre: 'Le double',
        idee: "Doubler un nombre, c'est l'ajouter à lui-même.",
        regle: n === null ? `= ${answer}` : `${n} + ${n} = ${answer}`,
      };
    }

    case 'moitie': {
      const n = leadingNumber(question.operation);
      return {
        titre: 'La moitié',
        idee: "La moitié, c'est partager en deux parts égales. C'est l'opération inverse du double.",
        regle: n === null ? `= ${answer}` : `${answer} + ${answer} = ${n}`,
        piege: "Seuls les nombres pairs ont une moitié entière.",
      };
    }

    default:
      return {
        titre: 'Calcul',
        idee: 'Repère ce que tu cherches, puis pose l\'opération qui y mène.',
        regle: question.operation.replace('?', String(answer)),
      };
  }
}
