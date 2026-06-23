import type { NumeralType } from 'src/modules/heure/heure.type';

interface ClockFaceProps {
  hour: number;     // 0-23
  minute: number;   // 0-59
  numeralType: NumeralType;
  mini?: boolean;   // masque le label matin/soir, utilisé dans les choix QCM expression
}

const ARABIC  = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const ROMAN   = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];

const CX = 100;
const CY = 100;
const FACE_R    = 89;
const TICK_OUT  = 88;
const TICK_H_IN = 77;   // tick d'heure (11px)
const TICK_M_IN = 83;   // tick de minute (5px)
const NUM_R     = 71;   // rayon des chiffres

/** x/y d'un point à <radius> du centre pour un angle horaire en degrés (0° = 12h). */
function clockPoint(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + radius * Math.sin(rad),
    y: CY - radius * Math.cos(rad),
  };
}

export default function ClockFace({ hour, minute, numeralType, mini = false }: ClockFaceProps) {
  const isAM = hour < 12;

  const minuteAngle = minute * 6;
  const hourAngle   = (hour % 12) * 30 + minute * 0.5;

  const minuteTip  = clockPoint(67, minuteAngle);
  const minuteTail = clockPoint(-12, minuteAngle);
  const hourTip    = clockPoint(47, hourAngle);
  const hourTail   = clockPoint(-9, hourAngle);

  const labels = numeralType === 'roman' ? ROMAN : ARABIC;

  return (
    <div className={`ClockFace${mini ? ' ClockFace--mini' : ''}`}>
      <svg
        viewBox="0 0 200 200"
        className="ClockFace__svg"
        aria-label={`Horloge : ${String(hour).padStart(2, '0')}h${String(minute).padStart(2, '0')}`}
      >
        {/* Fond */}
        <circle cx={CX} cy={CY} r={FACE_R + 1} className="ClockFace__shadow" />
        <circle cx={CX} cy={CY} r={FACE_R} className="ClockFace__face" />

        {/* Graduations */}
        {Array.from({ length: 60 }, (_, i) => {
          const isHour = i % 5 === 0;
          const p1 = clockPoint(TICK_OUT, i * 6);
          const p2 = clockPoint(isHour ? TICK_H_IN : TICK_M_IN, i * 6);
          return (
            <line
              key={i}
              x1={p1.x} y1={p1.y}
              x2={p2.x} y2={p2.y}
              className={`ClockFace__tick${isHour ? ' ClockFace__tick--hour' : ''}`}
            />
          );
        })}

        {/* Chiffres */}
        {labels.map((label, i) => {
          const pos = clockPoint(NUM_R, i * 30);
          const isRoman = numeralType === 'roman';
          const fontSize = isRoman ? (label.length >= 4 ? 7.5 : 9) : 11;
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              className="ClockFace__number"
              fontSize={fontSize}
            >
              {label}
            </text>
          );
        })}

        {/* Aiguille des heures */}
        <line
          x1={hourTail.x} y1={hourTail.y}
          x2={hourTip.x}  y2={hourTip.y}
          className="ClockFace__hand ClockFace__hand--hour"
        />

        {/* Aiguille des minutes */}
        <line
          x1={minuteTail.x} y1={minuteTail.y}
          x2={minuteTip.x}  y2={minuteTip.y}
          className="ClockFace__hand ClockFace__hand--minute"
        />

        {/* Centre */}
        <circle cx={CX} cy={CY} r={5} className="ClockFace__center" />
        <circle cx={CX} cy={CY} r={2} className="ClockFace__center-dot" />
      </svg>

      {!mini && (
        <div className="ClockFace__period">
          <span className="ClockFace__period-icon">{isAM ? '☀️' : '🌙'}</span>
          <span className="ClockFace__period-label">{isAM ? 'matin' : 'après midi'}</span>
        </div>
      )}
    </div>
  );
}