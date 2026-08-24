import './etapes.scss';

interface Props {
  /** Les nombres écrits sous les graduations, dans l'ordre croissant. */
  graduations: number[];
  /** Le nombre à placer, signalé par un repère. Il n'a pas besoin d'être une graduation. */
  marque?: number;
}

/**
 * Une droite graduée : des repères réguliers, quelques nombres écrits dessous, et le
 * nombre cherché signalé.
 *
 * C'est la seule figure de la bibliothèque qu'aucun texte ne remplace : une droite
 * graduée SE VOIT, et l'exercice consiste justement à lire une position. Le corpus la
 * montre en image, donc rien à reprendre.
 *
 * Hauteur figée à deux interlignes (le trait, puis les nombres) pour que le texte qui
 * suit retombe sur la réglure du cahier.
 */
export default function DroiteGraduee({ graduations, marque }: Props) {
  const debut = graduations[0];
  const fin = graduations[graduations.length - 1];
  const etendue = fin - debut || 1;
  const position = (n: number) => `${((n - debut) / etendue) * 100}%`;

  return (
    <div className="Droite">
      <div className="Droite__axe">
        {graduations.map((n) => (
          <span className="Droite__tick" key={n} style={{ left: position(n) }} />
        ))}
        {marque !== undefined && (
          <span className="Droite__marque" style={{ left: position(marque) }}>
            <span className="Droite__marqueValeur">{marque}</span>
          </span>
        )}
      </div>

      <div className="Droite__labels">
        {graduations.map((n) => (
          <span className="Droite__label" key={n} style={{ left: position(n) }}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
