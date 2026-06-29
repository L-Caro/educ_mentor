import world from '@svg-maps/world';
import type { MapInteractionProps } from 'src/types/game.types';
import continentViewboxes from './data/continent_viewboxes.json';
import continentCountries from './data/continent_countries.json';

interface WorldMapProps extends MapInteractionProps {
  continent?: string;
  visibleKeys?: Set<string>;
}

export default function WorldMap({
  onSelect, selectedKey, correctKeys, answerState,
  continent, visibleKeys,
}: WorldMapProps) {
  const locked = answerState !== 'idle';

  // Continent mode : parse le viewBox pour obtenir l'offset de translation
  const continentData = continent
    ? (continentViewboxes as Record<string, string>)[continent]
    : null;
  const [vbX, vbY, vbW, vbH] = continentData
    ? continentData.split(' ').map(Number)
    : [0, 0, 0, 0];

  const continentIds = continent
    ? new Set((continentCountries as Record<string, string[]>)[continent] ?? [])
    : null;

  function pathClass(id: string): string {
    const base = 'WorldMap__path';
    const upper = id.toUpperCase();
    if (visibleKeys && !visibleKeys.has(upper)) return `${base} ${base}--hidden`;
    if (locked) {
      if (correctKeys.includes(upper)) return `${base} ${base}--correct`;
      if (selectedKey === upper)        return `${base} ${base}--wrong`;
      return `${base} ${base}--faded`;
    }
    if (selectedKey === upper) return `${base} ${base}--selected`;
    return base;
  }

  function handleClick(id: string) {
    if (locked) return;
    const upper = id.toUpperCase();
    if (visibleKeys && !visibleKeys.has(upper)) return;
    onSelect?.(upper);
  }

  const locations = continentIds
    ? world.locations.filter((loc) => continentIds.has(loc.id))
    : world.locations;

  return (
    <svg
      viewBox={continentData ? `0 0 ${vbW} ${vbH}` : world.viewBox}
      className="WorldMap"
      aria-label="Carte du monde"
    >
      {continentData ? (
        <g transform={`translate(${-vbX}, ${-vbY})`}>
          {locations.map((loc) => (
            <path
              key={loc.id}
              d={loc.path}
              className={pathClass(loc.id)}
              onClick={() => handleClick(loc.id)}
            >
              <title>{loc.name}</title>
            </path>
          ))}
        </g>
      ) : (
        locations.map((loc) => (
          <path
            key={loc.id}
            d={loc.path}
            className={pathClass(loc.id)}
            onClick={() => handleClick(loc.id)}
          >
            <title>{loc.name}</title>
          </path>
        ))
      )}
    </svg>
  );
}