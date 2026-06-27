import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { GameAnswerState } from 'src/hooks';

interface GameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  answerState: GameAnswerState;
  variant?: 'number' | 'text' | 'time';
  timeSeparator?: ':' | 'h';
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
 *
 * variant='time' : deux inputs [HH]:[MM] — value attendue en "HH:MM", auto-avance vers MM.
 */
export default function GameInput({
  value,
  onChange,
  onSubmit,
  answerState,
  variant = 'number',
  timeSeparator = ':',
  placeholder,
  maxLength,
  numeric = false,
  inputMode,
  suffix,
  focusKey,
}: GameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const isLocked = answerState !== 'idle';

  useEffect(() => {
    if (!isLocked) setTimeout(() => inputRef.current?.focus(), 50);
  }, [focusKey, isLocked]);

  const stateClass =
    answerState === 'correct' ? ' GameInput__field--correct'
    : answerState === 'wrong' || answerState === 'timeout' ? ' GameInput__field--wrong'
    : '';

  // ── Variant time ──────────────────────────────────────────────────────────

  if (variant === 'time') {
    const [h = '', m = ''] = value.split(':');

    function handleHoursChange(raw: string) {
      if (isLocked) return;
      const digits = raw.replace(/\D/g, '').slice(0, 2);
      onChange(`${digits}:${m}`);
      // auto-avance : 2 chiffres saisis, ou premier chiffre > 2 (impossible pour 0-23)
      if (digits.length === 2 || (digits.length === 1 && parseInt(digits, 10) > 2)) {
        minuteRef.current?.focus();
      }
    }

    function handleMinutesChange(raw: string) {
      if (isLocked) return;
      const digits = raw.replace(/\D/g, '').slice(0, 2);
      onChange(`${h}:${digits}`);
    }

    return (
      <div className="GameInput GameInput--time">
        <div className="GameInput__time">
          <input
            ref={inputRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`GameInput__field GameInput__field--time-part${stateClass}`}
            value={h}
            onChange={(e) => handleHoursChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            disabled={isLocked}
            placeholder="HH"
            maxLength={2}
            autoComplete="off"
          />
          <span className="GameInput__time-sep">{timeSeparator}</span>
          <input
            ref={minuteRef}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            className={`GameInput__field GameInput__field--time-part${stateClass}`}
            value={m}
            onChange={(e) => handleMinutesChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
            disabled={isLocked}
            placeholder="MM"
            maxLength={2}
            autoComplete="off"
          />
        </div>
      </div>
    );
  }

  // ── Variant standard (number / text) ──────────────────────────────────────

  function handleChange(raw: string) {
    if (isLocked) return;
    onChange(numeric ? raw.replace(/\D/g, '') : raw);
  }

  const textSize = variant === 'text'
    ? Math.max(6, Math.max(value.length, placeholder?.length ?? 0) + 2)
    : undefined;

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
      size={textSize}
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );

  return (
    <div className={`GameInput${variant === 'text' ? ' GameInput--text-mode' : ''}`}>
      {suffix ? (
        <div className="GameInput__wrap">
          {field}
          <span className="GameInput__suffix">{suffix}</span>
        </div>
      ) : field}
    </div>
  );
}
