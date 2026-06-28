import { useRef } from 'react';
import france from '@svg-maps/france.departments';
import citiesData from './data/france_cities.json';
import type { PointMapInteractionProps } from 'src/types/game.types.ts';

const VIEWBOX_W = 613;
const VIEWBOX_H = 585;

export default function FranceCityMap({
  targetSvgPoint,
  onPointClick,
  clickedSvgPoint,
  distanceKm,
  answerState,
}: PointMapInteractionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const locked = answerState !== 'idle';

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (locked || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width)  * VIEWBOX_W;
    const svgY = ((e.clientY - rect.top)  / rect.height) * VIEWBOX_H;
    const dx = svgX - targetSvgPoint.x;
    const dy = svgY - targetSvgPoint.y;
    const distanceKm = Math.sqrt(dx * dx + dy * dy) * citiesData.kmsPerSvgUnit;
    onPointClick({ svgX, svgY, distanceKm });
  }

  const showCorrect = answerState !== 'idle';

  return (
    <svg
      ref={svgRef}
      viewBox={france.viewBox}
      className="FranceCityMap"
      onClick={handleClick}
      aria-label="Carte de France — placer la ville"
      style={{ cursor: locked ? 'default' : 'crosshair' }}
    >
      {france.locations.map((loc) => (
        <path
          key={loc.id}
          d={loc.path}
          className="FranceCityMap__dept"
        />
      ))}

      {clickedSvgPoint && (
        <circle
          cx={clickedSvgPoint.x}
          cy={clickedSvgPoint.y}
          r={5}
          className={`FranceCityMap__pin FranceCityMap__pin--click${showCorrect ? (distanceKm! <= 0 ? ' FranceCityMap__pin--correct' : ' FranceCityMap__pin--wrong') : ''}`}
        />
      )}

      {showCorrect && (
        <circle
          cx={targetSvgPoint.x}
          cy={targetSvgPoint.y}
          r={6}
          className="FranceCityMap__pin FranceCityMap__pin--target"
        />
      )}

      {showCorrect && clickedSvgPoint && (
        <line
          x1={clickedSvgPoint.x} y1={clickedSvgPoint.y}
          x2={targetSvgPoint.x}  y2={targetSvgPoint.y}
          className="FranceCityMap__line"
        />
      )}
    </svg>
  );
}
