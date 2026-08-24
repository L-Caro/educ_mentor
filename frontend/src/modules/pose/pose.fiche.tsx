import type { Fiche } from 'src/types/fiche.types';
import type { PoseQuestion } from './pose.type';
import PoseFigure from './PoseFigure';

/**
 * Fiche dérivée de l'opération en cours. Elle rappelle l'ordre des gestes et MONTRE
 * l'opération posée, retenues comprises : sur un calcul posé, l'erreur vient presque
 * toujours d'une colonne traitée dans le désordre ou d'une retenue oubliée.
 *
 * Pour la soustraction, le geste dépend de la méthode réglée en administration. Les deux
 * donnent le même résultat mais ne s'écrivent pas pareil, et décrire la mauvaise serait
 * pire que ne rien décrire : l'enfant croirait s'être trompée en suivant sa maîtresse.
 */
export function poseFiche(question: PoseQuestion): Fiche {
  const addition = question.operation === 'addition';
  const cassage = question.method === 'cassage';

  return {
    titre: `${question.operands[0]} ${addition ? '+' : '−'} ${question.operands[1]}`,
    idee: addition
      ? "On additionne colonne par colonne, en partant des unités. Dès qu'une colonne dépasse 9, on écrit le chiffre des unités et on reporte la dizaine au-dessus de la colonne suivante."
      : cassage
        ? "On soustrait colonne par colonne, en partant des unités. Quand le chiffre du haut est trop petit, on emprunte une dizaine à son voisin de gauche : c'est le nombre du haut qu'on démonte."
        : "On soustrait colonne par colonne, en partant des unités. Quand le chiffre du haut est trop petit, on lui ajoute 10, et on rend cette dizaine au nombre du bas.",

    // Le geste, décomposé. Il ne sert que là où il y a quelque chose à faire : sur une
    // opération sans retenue, énoncer une règle qui ne s'applique pas brouille la lecture.
    regle: question.has_carry ? gestes(addition, cassage) : undefined,

    exemple: <PoseFigure question={question} />,

    piege: !question.has_carry
      ? 'Ici, aucune retenue : chaque colonne se calcule seule.'
      : addition
        ? "La retenue s'écrit au-dessus de la colonne SUIVANTE, pas de celle qu'on vient de calculer."
        : cassage
          ? "Le voisin de gauche a prêté : il vaut 1 de moins. C'est le chiffre barré qu'on oublie, et toute la fin du calcul est fausse."
          : "La dizaine s'ajoute au nombre du BAS, jamais au résultat. Elle se rend à la colonne de gauche, pas à celle qu'on vient de calculer.",
  };
}

/** Les gestes dans l'ordre où la main les fait. Une ligne, un geste. */
function gestes(addition: boolean, cassage: boolean): string[] {
  if (addition) {
    return [
      "J'additionne la colonne. Elle dépasse 9.",
      "J'écris le chiffre des unités sous le trait.",
      "Je reporte 1 au-dessus de la colonne de gauche.",
    ];
  }

  if (cassage) {
    return [
      'Je ne peux pas retirer : le chiffre du haut est trop petit.',
      'Je barre son voisin de gauche et je le réécris diminué de 1.',
      "La dizaine empruntée s'ajoute à mon chiffre : 7 devient 17.",
      'Je barre le 7 aussi : le nombre du haut se lit maintenant au-dessus.',
    ];
  }

  return [
    'Je ne peux pas retirer : le chiffre du haut est trop petit.',
    "J'ajoute 10 à mon chiffre : 7 devient 17.",
    "Cette dizaine, je la rends en bas : j'ajoute 1 au chiffre de gauche du nombre du bas.",
  ];
}
