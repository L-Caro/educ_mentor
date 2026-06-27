import type { ReactNode } from 'react';
import type { GameAnswerState } from 'src/hooks';

export interface GameChoiceOption {
  key: string;
  label: ReactNode;
}

interface GameChoicesSingleProps {
  options: GameChoiceOption[];
  answerState: GameAnswerState;
  layout?: 'list' | 'grid';
  selectedKey: string | null;
  correctKey: string;
  onSelect: (key: string) => void;
  selectedKeys?: never;
  correctKeys?: never;
  onToggle?: never;
}

interface GameChoicesMultiProps {
  options: GameChoiceOption[];
  answerState: GameAnswerState;
  layout?: 'list' | 'grid';
  selectedKeys: Set<string>;
  correctKeys: string[];
  onToggle: (key: string) => void;
  selectedKey?: never;
  correctKey?: never;
  onSelect?: never;
}

type GameChoicesProps = GameChoicesSingleProps | GameChoicesMultiProps;

export default function GameChoices(props: GameChoicesProps) {
  const { options, answerState, layout } = props;
  const isMulti = 'onToggle' in props && props.onToggle !== undefined;

  function choiceClass(key: string): string {
    const base = 'GameChoices__choice';
    if (isMulti) {
      const { selectedKeys, correctKeys } = props as GameChoicesMultiProps;
      if (answerState === 'idle') {
        return selectedKeys.has(key) ? `${base} ${base}--checked` : base;
      }
      const inAnswer = correctKeys.includes(key);
      const wasSelected = selectedKeys.has(key);
      if (inAnswer && wasSelected)  return `${base} ${base}--correct`;
      if (inAnswer && !wasSelected) return `${base} ${base}--missed`;
      if (!inAnswer && wasSelected) return `${base} ${base}--wrong`;
      return `${base} ${base}--faded`;
    } else {
      const { selectedKey, correctKey } = props as GameChoicesSingleProps;
      if (answerState === 'idle') {
        return key === selectedKey ? `${base} ${base}--selected` : base;
      }
      if (key === correctKey)  return `${base} ${base}--correct`;
      if (key === selectedKey) return `${base} ${base}--wrong`;
      return `${base} ${base}--faded`;
    }
  }

  function handleClick(key: string) {
    if (isMulti) {
      (props as GameChoicesMultiProps).onToggle(key);
    } else {
      (props as GameChoicesSingleProps).onSelect(key);
    }
  }

  return (
    <div className={`GameChoices${layout === 'grid' ? ' GameChoices--grid' : ''}`}>
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className={choiceClass(option.key)}
          onClick={() => handleClick(option.key)}
          disabled={answerState !== 'idle'}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
