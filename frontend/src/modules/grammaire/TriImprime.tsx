import type { MotImprime } from './PhraseImprimee';
import Phrase from './PhraseImprimee';
import './grammaire.impression.scss';

/** Le nom lisible d'une nature. Le catalogue des libelles vit en administration et
 * n'arrive pas jusqu'ici ; ces sept-la ne bougeront pas, et un en-tete de colonne doit
 * etre court pour tenir dans un tiers de largeur. */
const ENTETES: Record<string, string> = {
  nom_commun: 'noms',
  nom_propre: 'noms propres',
  verbe: 'verbes',
  determinant: 'déterminants',
  adjectif: 'adjectifs',
  pronom_sujet: 'pronoms',
  invariable: 'invariables',
};

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
