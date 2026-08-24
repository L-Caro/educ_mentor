import { FORMES } from './catalogue-formes';
import './etapes.scss';

interface Props {
  /** Les figures à montrer, dans l'ordre, avec ce qu'on veut en dire. */
  items: { forme: keyof typeof FORMES; legende: string }[];
}

/**
 * Une rangée de figures géométriques légendées.
 *
 * Le catalogue des tracés est dans `formes.tsx` : les figures se répètent d'une fiche à
 * l'autre (le carré apparaît dans « le carré », dans « les solides » et dans « la
 * symétrie »), et les redessiner à chaque fois les ferait diverger.
 *
 * La hauteur est figée à quatre interlignes, dessin et légende compris, pour que le texte
 * qui suit retombe sur la réglure du cahier.
 */
export default function Formes({ items }: Props) {
  return (
    <div className="Formes">
      {items.map(({ forme, legende }) => (
        <figure className="Forme" key={forme}>
          <svg className="Forme__dessin" viewBox="0 0 100 105" role="img" aria-label={legende}>
            {FORMES[forme]}
          </svg>
          <figcaption className="Forme__legende">{legende}</figcaption>
        </figure>
      ))}
    </div>
  );
}
