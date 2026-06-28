import { useState } from 'react';
import france from '@svg-maps/france.departments';
import regionData from './data/france_regions.json';
import type { MapInteractionProps } from 'src/types/game.types.ts';

const deptToRegion = regionData.deptToRegion as Record<string, string>;

export default function FranceRegionMap({
  onSelect,
  selectedKey,
  correctKeys,
  answerState,
}: MapInteractionProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const locked = answerState !== 'idle';

  function pathClass(deptId: string): string {
    const regionCode = deptToRegion[deptId];
    if (!regionCode) return 'FranceRegionMap__path FranceRegionMap__path--dom';

    const base = 'FranceRegionMap__path';

    if (answerState !== 'idle') {
      if (correctKeys.includes(regionCode)) return `${base} ${base}--correct`;
      if (regionCode === selectedKey)       return `${base} ${base}--wrong`;
      return `${base} ${base}--faded`;
    }

    if (regionCode === selectedKey) return `${base} ${base}--selected`;
    if (regionCode === hovered)     return `${base} ${base}--hover`;
    return base;
  }

  return (
    <svg
      viewBox={france.viewBox}
      className="FranceDeptMap"
      aria-label="Carte des régions de France métropolitaine"
    >
      {france.locations.map((loc) => {
        const regionCode = deptToRegion[loc.id];
        return (
          <path
            key={loc.id}
            d={loc.path}
            className={pathClass(loc.id)}
            onClick={() => !locked && regionCode && onSelect(regionCode)}
            onMouseEnter={() => !locked && setHovered(regionCode ?? null)}
            onMouseLeave={() => setHovered(null)}
            aria-label={regionCode ? regionData.regions[regionCode as keyof typeof regionData.regions]?.name : loc.name}
          />
        );
      })}
    </svg>
  );
}