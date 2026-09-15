import Blanc from 'src/impression/Blanc';
import type { FournisseurImpression } from 'src/impression/impression.types';

/**
 * Un accord a completer.
 *
 * L'enonce du module est deja construit pour le jeu : une consigne, un point de depart
 * eventuel, ce qui precede le trou, ce qui le suit, et l'indication entre parentheses.
 * On l'imprime tel quel, avec un blanc a la place du champ de saisie. Le papier dit alors
 * exactement ce que dit l'ecran, ce qui evite qu'elle apprenne deux formulations pour la
 * meme regle.
 */
export const accordsImpression: FournisseurImpression = {
  label: 'Les accords',
  exercices: [
    {
      cle: 'accord',
      label: 'Accords (genre, nombre, adjectif, groupe nominal, sujet et verbe)',
      enonce: (donnees) => (
        <div>
          <p className="Feuille__consigne">{String(donnees.consigne)}</p>
          <span>
            {donnees.depart ? `${String(donnees.depart)} → ` : ''}
            {String(donnees.avant)}
            <Blanc largeurMm={26} />
            {String(donnees.apres)}
            {donnees.indice ? ` (${String(donnees.indice)})` : ''}
          </span>
        </div>
      ),
      reponse: (donnees) => String(donnees.reponse),
    },
  ],
};
