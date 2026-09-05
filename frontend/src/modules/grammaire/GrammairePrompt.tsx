import PhraseMarquee from './PhraseMarquee';
import type { GrammaireQuestion } from './grammaire.type';

/**
 * L'énoncé, et la phrase quand elle n'est pas déjà rendue par la zone de sélection.
 *
 * Pour `nature_mot`, la phrase appartient à l'énoncé : le mot souligné est ce sur quoi
 * porte la question, et la phrase est ce qui rend la question décidable : « ferme » est
 * un nom ou un verbe selon elle. Pour les questions de sélection, la phrase est la zone
 * de réponse : c'est `PhraseCliquable` qui la rend, et l'afficher deux fois embrouillerait.
 */
export default function GrammairePrompt({
  question,
}: {
  question: GrammaireQuestion;
}) {
  return (
    <div className="GrammairePrompt">
      <p className="GrammairePrompt__question">{question.display}</p>
      {question.type === 'nature_mot' && question.cible !== null && (
        <PhraseMarquee mots={question.mots} marques={[question.cible]} />
      )}
    </div>
  );
}
