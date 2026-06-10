import type { ReactNode } from 'react';
import type { GameAnswerState } from 'src/hook/useGameSession.ts';

export interface GameChoiceOption {
  key: string;        // identité unique du choix (sert aussi de clé React)
  label: ReactNode;   // contenu déjà formaté par le module (nombre, mot, montant…)
}

interface GameChoicesProps {
  options: GameChoiceOption[];
  selectedKey: string | null;
  correctKey: string;
  answerState: GameAnswerState;
  onSelect: (key: string) => void;
}

/**
 * QCM partagé par tous les modules : une réponse par ligne, logique d'état unique.
 * idle → le choix cliqué passe en `--selected` ; après validation → `--correct`,
 * `--wrong` (le choix erroné de l'élève) et `--faded` (les autres).
 */
export default function GameChoices({ options, selectedKey, correctKey, answerState, onSelect }: GameChoicesProps) {
  function choiceClass(key: string): string {
    const base = 'GameChoices__choice';
    if (answerState === 'idle') {
      return key === selectedKey ? `${base} ${base}--selected` : base;
    }
    if (key === correctKey) return `${base} ${base}--correct`;
    if (key === selectedKey) return `${base} ${base}--wrong`;
    return `${base} ${base}--faded`;
  }

  return (
    <div className="GameChoices">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={choiceClass(option.key)}
          onClick={() => onSelect(option.key)}
          disabled={answerState !== 'idle'}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
