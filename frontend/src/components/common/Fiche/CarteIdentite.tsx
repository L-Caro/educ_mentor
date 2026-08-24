interface Ligne {
  label: string;
  valeur: string;
}

interface Props {
  titre: string;
  /** Emoji de drapeau, quand le sujet en a un. */
  embleme?: string;
  lignes: Ligne[];
}

/**
 * Une carte d'identité : un sujet, et ce qu'on en sait, en lignes label/valeur.
 *
 * C'est le second genre de fiche. En géographie il n'y a pas de règle à énoncer :
 * « pourquoi Lima ? » n'a pas de réponse. Ce qui aide, c'est de voir la fiche complète du
 * pays. Rater sa capitale, puis lire sa carte, prépare la question suivante sur son
 * continent ou ses voisins.
 *
 * Composant commun : géographie, France et tout module dont le sujet est un fait plutôt
 * qu'une règle.
 */
export default function CarteIdentite({ titre, embleme, lignes }: Props) {
  return (
    <div className="CarteIdentite">
      <p className="CarteIdentite__titre">
        {embleme && <span className="CarteIdentite__embleme" aria-hidden="true">{embleme}</span>}
        {titre}
      </p>
      <dl className="CarteIdentite__lignes">
        {lignes.map((ligne) => (
          <div key={ligne.label} className="CarteIdentite__ligne">
            <dt>{ligne.label}</dt>
            <dd>{ligne.valeur}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
