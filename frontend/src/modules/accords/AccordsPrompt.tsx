import type { AccordsQuestion } from './accords.type';

/**
 * L'énoncé d'une question d'accord : la consigne, le point de départ d'une transformation
 * s'il y en a un, puis la ligne à compléter.
 *
 * Le trou est un ⬚ et non un `_____` : la longueur d'un tiret bas est une indication
 * involontaire sur la longueur de la réponse, et « les petits chats » n'a pas la même
 * longueur que « le petit chat ».
 *
 * Les segments `avant` et `apres` portent des espaces significatifs (« Les filles ⬚ dans
 * le jardin. ») : ils sont rendus en `white-space: pre-wrap`, sinon HTML les replierait et
 * le trou se collerait au mot voisin.
 */
export default function AccordsPrompt({
  question,
}: {
  question: AccordsQuestion;
}) {
  return (
    <div className="AccordsPrompt">
      <p className="AccordsPrompt__consigne">{question.display}</p>

      {question.depart && (
        <p className="AccordsPrompt__depart">
          <span className="AccordsPrompt__departTexte">{question.depart}</span>
          <span className="AccordsPrompt__fleche" aria-hidden="true">
            →
          </span>
        </p>
      )}

      <p className="AccordsPrompt__ligne">
        <span className="AccordsPrompt__segment">{question.avant}</span>
        <span className="AccordsPrompt__trou" aria-label="mot à trouver">
          ⬚
        </span>
        <span className="AccordsPrompt__segment">{question.apres}</span>
      </p>

      {question.indice && (
        <p className="AccordsPrompt__indice">({question.indice})</p>
      )}
    </div>
  );
}
