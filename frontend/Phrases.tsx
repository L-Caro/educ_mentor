import { rendre } from './marques';
import './etapes.scss';

/**
 * Des exemples en phrases, un par interligne, avec les mots qui portent la leçon marqués.
 * Le balisage est décrit dans `marques.tsx`.
 */
export default function Phrases({ lignes }: { lignes: string[] }) {
  return (
    <div className="Phrases">
      {lignes.map((ligne) => (
        <div className="Phrases__ligne" key={ligne}>
          {rendre(ligne)}
        </div>
      ))}
    </div>
  );
}
