import type { Fiche } from 'src/types/fiche.types';
import type { MonnaieQuestion } from './monnaie.type';

/** Centimes vers euros, avec la virgule française. */
function euros(centimes: number): string {
  return `${(centimes / 100).toFixed(2).replace('.', ',')} €`;
}

export function monnaieFiche(question: MonnaieQuestion): Fiche {
  switch (question.type) {
    case 'reconnaitre': {
      const pieces = question.coins ?? [];
      return {
        titre: 'Compter de la monnaie',
        idee: "Additionne les pièces et les billets. Commence par les plus grosses valeurs, il reste moins à retenir.",
        regle: pieces.length
          ? `${pieces.map(euros).join(' + ')} = ${euros(question.answer)}`
          : euros(question.answer),
        piege: "1 € vaut 100 centimes : une pièce de 50 centimes n'est pas une pièce de 50 €.",
      };
    }

    case 'total': {
      const prix = question.prices ?? [];
      return {
        titre: "Total d'un achat",
        idee: "Le total, c'est la somme de tous les prix. Rien ne s'enlève.",
        regle: prix.length
          ? `${prix.map(euros).join(' + ')} = ${euros(question.answer)}`
          : euros(question.answer),
      };
    }

    case 'rendre': {
      const prix = question.price;
      const donne = question.payment;
      return {
        titre: 'Rendre la monnaie',
        idee: "Ce qu'on te rend, c'est ce qui reste entre le prix et la somme donnée. Tu peux aussi compter en avançant depuis le prix.",
        regle: prix !== undefined && donne !== undefined
          ? `${euros(donne)} moins ${euros(prix)} = ${euros(question.answer)}`
          : euros(question.answer),
        piege: "On rend la différence, pas le prix de l'article.",
      };
    }
  }
}
