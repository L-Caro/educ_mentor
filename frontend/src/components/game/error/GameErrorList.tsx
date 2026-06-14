import type { GameResultEntry } from '../result/GameResult.ts';

/** Liste uniforme des erreurs à retravailler. Slot vignette optionnel (Imagier). */
export default function GameErrorList({ errors }: { errors: GameResultEntry[] }) {
  return (
    <>
      {errors.map((entry) => (
        <li key={entry.thumbUrl} className="GameResult__errorItem">
          {entry.thumbUrl !== undefined && (
            <div className="GameResult__errorThumb">
              {entry.thumbUrl ? <img src={entry.thumbUrl} alt="" /> : <span>❓</span>}
            </div>
          )}
          <div className="GameResult__errorLeft">
            <span className="GameResult__errorOp">{entry.label}</span>
            {entry.timeout && <span className="GameResult__errorTimeout">⏰ Trop tard</span>}
            {!entry.timeout && entry.given !== null && (
              <span className="GameResult__errorGiven">Réponse donnée : {entry.given}</span>
            )}
          </div>
          <span className="GameResult__errorAnswer">{entry.expected}</span>
        </li>
      ))}
    </>
  );
}
