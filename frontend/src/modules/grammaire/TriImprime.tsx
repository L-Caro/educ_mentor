import type { MotImprime } from './PhraseImprimee';
import Phrase from './PhraseImprimee';
import { ENTETES } from './grammaire.natures';
import './grammaire.impression.scss';

/**
 * Une phrase, et les colonnes ou ranger ses mots.
 *
 * Les colonnes sont des CASES A REMPLIR, pas un tableau de reponses : elles sont vides et
 * hautes, et leur nombre est celui des natures ouvertes en administration. Une colonne
 * qui reste vide est une reponse elle aussi, c'est pourquoi on n'enleve jamais celle dont
 * la phrase ne contient aucun mot.
 */
export default function TriImprime({
  mots,
  colonnes,
}: {
  mots: MotImprime[];
  colonnes: string[];
}) {
  return (
    <div>
      <Phrase mots={mots} cible={null} />
      <table className="Tri">
        <thead>
          <tr>
            {colonnes.map((colonne) => (
              <th key={colonne} className="Tri__entete">
                {ENTETES[colonne] ?? colonne}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {colonnes.map((colonne) => (
              <td key={colonne} className="Tri__case" />
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
