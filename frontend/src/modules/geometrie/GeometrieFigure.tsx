import { FORMES } from 'src/cours/components/catalogue-formes';
import './geometrie.scss';

interface Props {
  shape: string;
  /** Révèle le nom sous le dessin. Jamais pendant une question `nom_figure`/`nom_solide` :
   * ce serait donner la réponse. Utilisé dans la fiche d'erreur, après coup. */
  legende?: string;
  size?: 'lg' | 'sm';
}

/** Une figure du catalogue de géométrie, en SVG. Le tracé est celui des fiches de cours
 * (`cours/components/catalogue-formes.tsx`) : même source, pour ne jamais diverger. */
export default function GeometrieFigure({ shape, legende, size = 'lg' }: Props) {
  const trace = FORMES[shape as keyof typeof FORMES];

  return (
    <figure className={`GeometrieFigure GeometrieFigure--${size}`}>
      <svg viewBox="0 0 100 105" role="img" aria-label={legende ?? shape}>
        {trace}
      </svg>
      {legende && <figcaption className="GeometrieFigure__legende">{legende}</figcaption>}
    </figure>
  );
}
