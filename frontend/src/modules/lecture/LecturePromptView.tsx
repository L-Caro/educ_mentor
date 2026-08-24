import { useState } from 'react';
import type { LectureQuestion } from './lecture.type';
import { surligner } from './surligner';

// ─── Rendu du texte avec surlignage optionnel ─────────────────────────────────

function renderTextBody(contenu: string, excerpt: string | null) {
  return (
    <p className="LectureText__body">
      {surligner(contenu, excerpt, 'LectureText__highlight')}
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
