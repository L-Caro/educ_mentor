import type { Fiche } from 'src/types/fiche.types';
import type { CompteQuestion } from './compte.type';
import { ecrireEtape } from './compteValue';

/**
 * La fiche d'un compte manqué montre UN CHEMIN, pas la méthode.
 *
 * Il n'y a pas de règle à réciter : chercher 348 avec 100, 75, 8, 4, 3, 2 ne s'apprend
 * pas par une procédure. Ce qui s'apprend, c'est le réflexe — regarder la cible, chercher
 * la grande plaque qui en approche, viser l'écart. Alors la fiche donne la solution de
 * référence étape par étape, et nomme le geste qui l'a rendue possible.
 */
export function compteFiche(question: CompteQuestion): Fiche | null {
  if (question.solution.length === 0) return null;

  const premiere = question.solution[0];

  return {
    titre: `Cible ${question.cible}`,
    idee:
      'On part de la cible, pas des plaques : quel grand nombre en approche, et combien ' +
      'reste-t-il à ajouter ou à retirer ?',
    regle: question.solution.map(ecrireEtape),
    exemple: (
      <div className="CompteFiche">
        <p className="CompteFiche__ligne">
          Les plaques : <strong>{question.plaques.join(' · ')}</strong>
        </p>
        <p className="CompteFiche__ligne">
          Le premier pas : <strong>{ecrireEtape(premiere)}</strong>
        </p>
        <p className="CompteFiche__ligne">
          Il restait alors à atteindre <strong>{question.cible}</strong> depuis{' '}
          <strong>{premiere.resultat}</strong>.
        </p>
      </div>
    ),
    piege:
      "Une plaque ne sert qu'une fois. Et il n'y a souvent pas qu'un seul chemin : " +
      'celui-ci en est un, pas le seul bon.',
  };
}
