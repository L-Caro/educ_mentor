import './etapes.scss';

interface Props {
  /** Une ligne de calcul par étape, dans l'ordre où on les écrit. */
  lignes: string[];
  /** Cale les lignes sur le signe « = » plutôt qu'à gauche. */
  aligne?: 'gauche' | 'egal';
}

/**
 * Une suite d'étapes de calcul, une par interligne.
 *
 * Presque toutes les fiches de calcul montrent la même chose : un calcul déplié en
 * plusieurs lignes. Les écrire dans une phrase les rend illisibles, et c'est exactement
 * le reproche qui avait été fait à la décomposition des nombres en numération.
 *
 * La hauteur suit `--fiche-line` : la figure occupe un nombre entier d'interlignes, et le
 * texte qui la suit retombe sur la réglure.
 */
export default function Etapes({ lignes, aligne = 'gauche' }: Props) {
  if (aligne === 'egal') {
    // Deux colonnes autour du signe : les résultats s'alignent verticalement, ce qui
    // fait voir d'un coup d'œil ce qui change d'une ligne à l'autre.
    const paires = lignes.map((ligne) => {
      const coupe = ligne.indexOf('=');
      return coupe === -1
        ? { gauche: ligne, droite: '' }
        : { gauche: ligne.slice(0, coupe).trim(), droite: ligne.slice(coupe + 1).trim() };
    });

    return (
      <div className="Etapes Etapes--egal">
        {paires.map(({ gauche, droite }) => (
          <div className="Etapes__ligne" key={gauche + droite}>
            <span className="Etapes__gauche">{gauche}</span>
            <span className="Etapes__egal" aria-hidden="true">=</span>
            <span className="Etapes__droite">{droite}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="Etapes">
      {lignes.map((ligne) => (
        <div className="Etapes__ligne" key={ligne}>
          {ligne}
        </div>
      ))}
    </div>
  );
}
