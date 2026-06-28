import france from '@svg-maps/france.departments';
import type { MapInteractionProps } from 'src/types/game.types.ts';

export default function FranceDeptMap({
  onSelect,
  onToggle,
  selectedKey,
  selectedKeys,
  correctKeys,
  answerState,
}: MapInteractionProps) {
  const locked = answerState !== 'idle';
  const isMulti = !!onToggle;

  function pathClass(id: string): string {
    const base = 'FranceDeptMap__path';

    if (isMulti) {
      const checked = selectedKeys.has(id);
      if (answerState === 'idle') {
        return checked ? `${base} ${base}--checked` : base;
      }
      const inAnswer = correctKeys.includes(id);
      if (inAnswer && checked)  return `${base} ${base}--correct`;
      if (inAnswer && !checked) return `${base} ${base}--missed`;
      if (!inAnswer && checked) return `${base} ${base}--wrong`;
      return `${base}`;
    }

    // Single-select
    if (answerState === 'idle') {
      return id === selectedKey ? `${base} ${base}--selected` : base;
    }
    if (correctKeys.includes(id)) return `${base} ${base}--correct`;
    if (id === selectedKey)       return `${base} ${base}--wrong`;
    return `${base}`;
  }

  function handleClick(id: string) {
    if (locked) return;
    if (isMulti) onToggle!(id);
    else onSelect!(id);
  }

  return (
    <svg
      viewBox={france.viewBox}
      className="FranceDeptMap"
      aria-label="Carte de France métropolitaine"
    >
      {france.locations.map((loc) => (
        <path
          key={loc.id}
          d={loc.path}
          className={pathClass(loc.id)}
          onClick={() => handleClick(loc.id)}
          aria-label={loc.name}
        >
          <title>{loc.name}</title>
        </path>
      ))}
    </svg>
  );
}