import type { Fiche } from 'src/types/fiche.types';
import type { NumerationQuestion, PositionKey } from './numeration.type';
import NumerationRangs from './NumerationRangs';
import { formatNumbers } from 'src/utils/formatNumber';
import { POSITION_NAME, POSITION_ORDER } from './numeration.constants';

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
        idee: "Cherche ce qu'on ajoute ou soustrait à chaque fois : l'écart entre deux termes voisins est toujours le même.",
        regle: pas === null
          ? `Terme suivant : ${question.answer}`
          : `${pas > 0 ? '+' : ''}${pas} à chaque fois → ${question.answer}`,
      };
    }

    case 'decomposition': {
      const positions = question.decompose_positions ?? [];
      const chiffres = question.answer.split(':');

      // Le serveur mélange les rangs pour le jeu ; on les remet du plus grand au plus petit,
      // et une ligne par rang : six rangs sur une seule ligne débordaient.
      const parRang = new Map(positions.map((rang, i) => [rang, chiffres[i] ?? '?']));
      const lignes = POSITION_ORDER
        .filter((rang) => parRang.has(rang))
        .map((rang, i) => `${i === 0 ? '  ' : '+ '}${parRang.get(rang)} ${POSITION_NAME[rang]}`);

      return {
        titre: 'Décomposer un nombre',
        idee: "Chaque chiffre a une valeur qui dépend de sa place. Décomposer, c'est dire combien il y a de chaque paquet, du plus grand au plus petit.",
        regle: lignes.length ? lignes : question.answer,
        piege: "Un zéro compte : sans lui, les chiffres suivants changeraient de place.",
      };
    }

    case 'romain_lecture':
    case 'romain_ecriture':
      return {
        titre: 'Les chiffres romains',
        idee: "I vaut 1, V vaut 5, X vaut 10, L vaut 50, C vaut 100, D vaut 500, M vaut 1 000. Un signe plus petit placé avant un plus grand se retire (IV = 5 − 1 = 4), placé après il s'ajoute (VI = 5 + 1 = 6).",
        regle: `${question.display} = ${question.answer}`,
        piege: "Sur les cadrans, 4 s'écrit souvent IIII : c'est juste aussi. Mais IV et VI ne sont pas le même nombre : l'ordre des signes compte.",
      };

    case 'romain_comparaison':
      return {
        titre: 'Comparer des nombres romains',
        idee: "Lis chaque nombre romain et retrouve sa valeur, puis compare les valeurs. La longueur de l'écriture ne dit rien : XIV (14) est plus long que XX (20)... et pourtant plus petit.",
        regle: `${question.display.replace(/\s{2,}/, ' ')} → ${question.answer}`,
        piege: "IV et IIII s'écrivent différemment mais valent tous les deux 4 : ils sont égaux.",
      };

    case 'valeur_positionnelle': {
      // `item_key` vaut « valpos_<nombre>_<rang> » : la donnée est là, propre, plutôt que
      // dans l'énoncé en français. Recopier l'énoncé dans l'encart le faisait déborder.
      const cle = /^valpos_(\d+)_(\w+)$/.exec(question.item_key);

      return {
        titre: "Valeur d'un chiffre",
        idee: "Chaque chiffre occupe un rang, et les rangs se comptent depuis la droite. Range le nombre dans le tableau et lis la colonne demandée.",
        regle: [`réponse : ${question.answer}`],
        exemple: cle
          ? <NumerationRangs nombre={Number(cle[1])} rang={cle[2] as PositionKey} />
          : undefined,
        piege: "Ne confonds pas le chiffre et ce qu'il vaut : le 3 de 300 est un 3, et il vaut trois centaines.",
      };
    }
  }
}
