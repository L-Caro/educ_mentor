import type { Fiche } from 'src/types/fiche.types';
import type { PoseQuestion } from './pose.type';
import PoseFigure from './PoseFigure';

/**
 * Fiche dérivée de l'opération en cours. Elle rappelle l'ordre des gestes et MONTRE
 * l'opération posée, retenues comprises : sur un calcul posé, l'erreur vient presque
 * toujours d'une colonne traitée dans le désordre ou d'une retenue oubliée.
 */
export function poseFiche(question: PoseQuestion): Fiche {
  const addition = question.operation === 'addition';

  return {
    titre: `${question.operands[0]} ${addition ? '+' : '−'} ${question.operands[1]}`,
    idee: addition
      ? "On additionne colonne par colonne, en partant des unités. Dès qu'une colonne dépasse 9, on écrit le chiffre des unités et on reporte la dizaine au-dessus de la colonne suivante."
      : "On soustrait colonne par colonne, en partant des unités. Quand le chiffre du haut est trop petit, on emprunte une dizaine à la colonne suivante.",
    exemple: <PoseFigure question={question} />,
    piege: question.has_carry
      ? "Cette opération a une retenue : c'est là que ça se joue."
      : 'Ici, aucune retenue : chaque colonne se calcule seule.',
  };
}
