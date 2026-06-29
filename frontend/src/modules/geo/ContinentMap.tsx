import world from '@svg-maps/world';
import type { MapInteractionProps } from 'src/types/game.types';
import continentCountries from './data/continent_countries.json';

// SVG id (lowercase) → continent name
const codeToContinent: Record<string, string> = {};
for (const [continent, codes] of Object.entries(
  continentCountries as Record<string, string[]>
)) {
  for (const code of codes) codeToContinent[code] = continent;
}

export default function ContinentMap({
  onSelect, selectedKey, correctKeys, answerState,
}: MapInteractionProps) {
  const locked = answerState !== 'idle';

  function pathClass(id: string): string {
    const base = 'ContinentMap__path';
    const continent = codeToContinent[id];
    if (!continent) return `${base} ${base}--neutral`;
    if (locked) {
      if (correctKeys.includes(continent)) return `${base} ${base}--correct`;
      if (selectedKey === continent)        return `${base} ${base}--wrong`;
      return `${base} ${base}--faded`;
    }
    if (selectedKey === continent) return `${base} ${base}--selected`;
    return base;
  }

  function handleClick(id: string) {
    if (locked) return;
    const continent = codeToContinent[id];
    if (continent) onSelect?.(continent);
  }

  return (
    <svg
      viewBox={world.viewBox}
      className="ContinentMap"
      aria-label="Carte des continents"
    >
      {world.locations.map((loc) => (
        <path
          key={loc.id}
          d={loc.path}
          className={pathClass(loc.id)}
          onClick={() => handleClick(loc.id)}
        >
          <title>{codeToContinent[loc.id] ?? loc.name}</title>
        </path>
      ))}
    </svg>
  );
}
