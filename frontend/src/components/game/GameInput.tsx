import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { GameAnswerState } from 'src/hooks';

interface GameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  answerState: GameAnswerState;
  variant?: 'number' | 'text';             // number = champ étroit gros chiffres ; text = large pour les mots
  placeholder?: string;
  maxLength?: number;
  numeric?: boolean;                       // type=tel + inputMode=numeric + filtre les non-chiffres
  inputMode?: 'numeric' | 'decimal' | 'text';
  suffix?: ReactNode;                      // ex: € pour Monnaie
  focusKey?: string | number;              // change à chaque question → recentre le focus
}

/**
 * Champ de saisie libre partagé : états visuels correct/wrong, validation au Enter,
 * focus auto à chaque nouvelle question. Le module garde le contrôle de `value`.
 */
export default function GameInput({
  value,
  onChange,
  onSubmit,
  answerState,
  variant = 'number',
  placeholder,
  maxLength,
  numeric = false,
  inputMode,
  suffix,
  focusKey,
}: GameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isLocked = answerState !== 'idle';

  useEffect(() => {
    if (!isLocked) setTimeout(() => inputRef.current?.focus(), 50);
  }, [focusKey, isLocked]);

  const stateClass =
    answerState === 'correct' ? ' GameInput__field--correct'
    : answerState === 'wrong' || answerState === 'timeout' ? ' GameInput__field--wrong'
    : '';

  function handleChange(raw: string) {
    if (isLocked) return;
    onChange(numeric ? raw.replace(/\D/g, '') : raw);
  }

  const field = (
    <input
      ref={inputRef}
      type={numeric ? 'tel' : 'text'}
      inputMode={inputMode ?? (numeric ? 'numeric' : undefined)}
      pattern={numeric ? '[0-9]*' : undefined}
      className={`GameInput__field GameInput__field--${variant}${stateClass}`}
      value={value}
      onChange={(event) => handleChange(event.target.value)}
      onKeyDown={(event) => event.key === 'Enter' && onSubmit()}
      disabled={isLocked}
      placeholder={placeholder}
      maxLength={maxLength}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );

  return (
    <div className="GameInput">
      {suffix ? (
        <div className="GameInput__wrap">
          {field}
          <span className="GameInput__suffix">{suffix}</span>
        </div>
      ) : field}
    </div>
  );
}
