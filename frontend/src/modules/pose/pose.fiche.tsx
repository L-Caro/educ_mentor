import type { Fiche } from 'src/types/fiche.types';
import type { PoseQuestion } from './pose.type';

/** Rend une opération telle qu'elle se pose, en chasse fixe. */
function poser(question: PoseQuestion, resultat: boolean): string[] {
  const [a, b] = question.operands;
  const largeur = question.columns;
  const signe = question.operation === 'addition' ? '+' : '−';
  const lignes = [
    String(a).padStart(largeur),
    `${signe} ${String(b).padStart(largeur - 1)}`,
    '─'.repeat(largeur + 1),
  ];
  if (resultat) lignes.push(String(question.answer).padStart(largeur));
  return lignes;
}

/**
 * Fiche dérivée de l'opération en cours. Elle rappelle l'ordre des gestes plutôt que le
 * résultat : sur une opération posée, l'erreur vient presque toujours d'une colonne
 * traitée dans le désordre ou d'une retenue oubliée.
 */
export function poseFiche(question: PoseQuestion): Fiche {
  const addition = question.operation === 'addition';

  return {
    titre: `${question.operands[0]} ${addition ? '+' : '−'} ${question.operands[1]}`,
    idee: addition
      ? "On additionne colonne par colonne, en partant des unités. Dès qu'une colonne dépasse 9, on écrit le chiffre des unités et on reporte la dizaine au-dessus de la colonne suivante."
      : "On soustrait colonne par colonne, en partant des unités. Quand le chiffre du haut est trop petit, on emprunte une dizaine à la colonne suivante.",
    regle: poser(question, true),
    piege: question.has_carry
      ? 'Cette opération a une retenue : c’est là que ça se joue.'
      : "Ici, aucune retenue : chaque colonne se calcule seule.",
  };
}
