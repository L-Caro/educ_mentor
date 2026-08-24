import { useState } from 'react';
import type { LectureQuestion } from './lecture.type';

// ─── Rendu du texte avec surlignage optionnel ─────────────────────────────────

function renderTextBody(contenu: string, excerpt: string | null) {
  if (!excerpt) return <p className="LectureText__body">{contenu}</p>;
  const idx = contenu.indexOf(excerpt);
  if (idx === -1) return <p className="LectureText__body">{contenu}</p>;
  return (
    <p className="LectureText__body">
      {contenu.slice(0, idx)}
      <mark className="LectureText__highlight">{excerpt}</mark>
      {contenu.slice(idx + excerpt.length)}
    </p>
  );
}

// ─── Prompt de question ───────────────────────────────────────────────────────
// key={question.item_key} depuis renderPrompt → état reset à chaque nouvelle question

export function LecturePromptView({ question }: { question: LectureQuestion }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="LecturePrompt">
      {question.show_text && (
        <div className="LecturePrompt__revealRow">
          <button
            type="button"
            className="LecturePrompt__revealBtn"
            onClick={() => setRevealed((r) => !r)}
          >
            {revealed ? '🙈 Cacher le texte' : '📖 Voir le texte'}
          </button>
          {revealed && (
            <div className="LectureText">
              <p className="LectureText__titre">{question.text_titre}</p>
              {renderTextBody(question.text_contenu, question.excerpt)}
            </div>
          )}
        </div>
      )}
      <p className="LecturePrompt__question">{question.display}</p>
    </div>
  );
}
