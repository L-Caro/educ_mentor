import { FORMES } from 'src/cours/components/catalogue-formes';
import './geometrie.impression.scss';

/**
 * La figure au trait, sans legende ni annotation de cours.
 *
 * Le trace vient du meme catalogue que l'ecran et les fiches. Une seconde serie de
 * dessins finirait par en differer, et un carre qui n'a pas la meme allure sur la feuille
 * et dans le jeu serait un obstacle de plus, pas un exercice.
 */
export default function FigureImprimee({ forme }: { forme: string }) {
  return (
    <svg viewBox="0 0 100 105" className="FigureImprimee" aria-hidden="true">
      {FORMES[forme as keyof typeof FORMES]}
    </svg>
  );
}
