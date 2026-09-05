import type { AccordsQuestion } from './accords.type';

/**
 * La réponse remise à sa place dans l'énoncé, pour la fiche.
 *
 * C'est la question que l'enfant vient de rater, complétée : pas un exemple neuf. Lui en
 * donner un autre lui demanderait de refaire deux fois le chemin, au moment où elle est
 * bloquée. Même parti pris que la fiche du module grammaire.
 */
export default function AccordsExemple({
  question,
}: {
  question: AccordsQuestion;
}) {
  return (
    <p className="AccordsExemple">
      {question.depart && (
        <>
          <span className="AccordsExemple__depart">{question.depart}</span>
          <span className="AccordsExemple__fleche" aria-hidden="true">
            →
          </span>
        </>
      )}
      <span className="AccordsExemple__segment">{question.avant}</span>
      <mark className="AccordsExemple__reponse">{question.answer}</mark>
      <span className="AccordsExemple__segment">{question.apres}</span>
    </p>
  );
}
