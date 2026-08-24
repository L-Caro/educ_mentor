import type { Fiche } from 'src/types/fiche.types';
import type { NumerationQuestion } from './numeration.type';
import { formatNumbers } from 'src/utils/formatNumber';
import { POSITION_NAME } from './numeration.constants';

export function numerationFiche(question: NumerationQuestion): Fiche {
  switch (question.type) {
    case 'comparaison':
      return {
        titre: 'Comparer deux nombres',
        idee: "Compare d'abord la longueur : le nombre qui a le plus de chiffres est le plus grand. À longueur égale, compare chiffre par chiffre en partant de la gauche.",
        regle: `${formatNumbers(question.display.replace(/\s{2,}/, ' '))} → ${question.answer}`,
        piege: "La pointe du signe montre toujours le plus petit.",
      };

    case 'suite': {
      const termes = question.suite_terms ?? [];
      const pas = termes.length >= 2 ? termes[1] - termes[0] : null;
      return {
        titre: 'Continuer une suite',
        idee: "Cherche ce qu'on ajoute à chaque fois : l'écart entre deux termes voisins est toujours le même.",
        regle: pas === null
          ? `Terme suivant : ${question.answer}`
          : `${pas > 0 ? '+' : ''}${pas} à chaque fois → ${question.answer}`,
      };
    }

    case 'decomposition': {
      const positions = question.decompose_positions ?? [];
      const chiffres = question.answer.split(':');
      return {
        titre: 'Décomposer un nombre',
        idee: "Chaque chiffre a une valeur qui dépend de sa place. Décomposer, c'est dire combien il y a de chaque paquet.",
        regle: positions.length
          ? positions.map((p, i) => `${chiffres[i] ?? '?'} ${POSITION_NAME[p]}`).join(' + ')
          : question.answer,
        piege: "Un zéro compte : sans lui, les chiffres suivants changeraient de place.",
      };
    }

    case 'valeur_positionnelle':
      return {
        titre: 'Valeur d\'un chiffre',
        idee: "Un chiffre ne vaut pas la même chose selon sa position. On lit les paquets de droite à gauche : unités, dizaines, centaines, milliers.",
        regle: `${formatNumbers(question.display)} → ${question.answer}`,
        piege: "Ne confonds pas le chiffre écrit et ce qu'il représente : le 3 de 300 vaut trois centaines.",
      };
  }
}
