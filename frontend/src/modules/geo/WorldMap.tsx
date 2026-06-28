import world from '@svg-maps/world';
import type { MapInteractionProps } from 'src/types/game.types';

export default function WorldMap({
  onSelect, selectedKey, correctKeys, answerState,
}: MapInteractionProps) {
  const locked = answerState !== 'idle';

  function pathClass(id: string): string {
    const base = 'WorldMap__path';
    const upper = id.toUpperCase();
    if (locked) {
      if (correctKeys.includes(upper)) return `${base} ${base}--correct`;
      if (selectedKey === upper) return `${base} ${base}--wrong`;
      return `${base} ${base}--faded`;
    }
    if (selectedKey === upper) return `${base} ${base}--selected`;
    return base;
  }

  return (
    <svg
      viewBox={world.viewBox}
      className="WorldMap"
      aria-label="Carte du monde"
      style={{ pointerEvents: locked ? 'none' : undefined }}
    >
      {world.locations.map((loc) => (
        <path
          key={loc.id}
          d={loc.path}
          className={pathClass(loc.id)}
          onClick={() => onSelect?.(loc.id.toUpperCase())}
        >
          <title>{loc.name}</title>
        </path>
      ))}
    </svg>
  );
}