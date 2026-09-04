import GeometrieFigure from './GeometrieFigure';
import type { GeometrieQuestion } from './geometrie.type';

/** Le dessin ne porte jamais le nom de la forme pendant la question : ce serait la
 * réponse pour `nom_figure`/`nom_solide`. La légende n'apparaît que dans la fiche. */
export default function GeometriePrompt({ question }: { question: GeometrieQuestion }) {
  return (
    <div className="GeometriePrompt">
      <p className="GeometriePrompt__question">{question.display}</p>
      <div
        className={`GeometriePrompt__figures${question.shapeB ? ' GeometriePrompt__figures--paire' : ''}`}
      >
        <GeometrieFigure shape={question.shape} />
        {question.shapeB && <GeometrieFigure shape={question.shapeB} />}
      </div>
    </div>
  );
}
