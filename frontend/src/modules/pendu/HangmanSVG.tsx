interface HangmanSVGProps {
  wrongCount: number;
  maxErrors: number;
}

const STROKE_PROPS = {
  stroke: 'var(--color-base-content)',
  strokeWidth: 3,
  strokeLinecap: 'round' as const,
};

const PARTS_6 = ['head', 'body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as const;

type PartName = typeof PARTS_6[number];

function renderPart(part: PartName) {
  switch (part) {
    case 'head':
      return <circle key="head" cx={140} cy={60} r={15} fill="none" {...STROKE_PROPS} />;
    case 'body':
      return <line key="body" x1={140} y1={75} x2={140} y2={130} {...STROKE_PROPS} />;
    case 'leftArm':
      return <line key="leftArm" x1={140} y1={90} x2={110} y2={115} {...STROKE_PROPS} />;
    case 'rightArm':
      return <line key="rightArm" x1={140} y1={90} x2={170} y2={115} {...STROKE_PROPS} />;
    case 'leftLeg':
      return <line key="leftLeg" x1={140} y1={130} x2={115} y2={165} {...STROKE_PROPS} />;
    case 'rightLeg':
      return <line key="rightLeg" x1={140} y1={130} x2={165} y2={165} {...STROKE_PROPS} />;
  }
}

export default function HangmanSVG({ wrongCount }: HangmanSVGProps) {
  const visibleParts = PARTS_6.slice(0, wrongCount);

  return (
    <svg
      viewBox="0 0 200 240"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: '200px', display: 'block', margin: '0 auto' }}
      aria-hidden="true"
    >
      {/* Potence : toujours visible */}
      <line x1={20} y1={225} x2={100} y2={225} {...STROKE_PROPS} />
      <line x1={40} y1={225} x2={40} y2={20} {...STROKE_PROPS} />
      <line x1={40} y1={20} x2={140} y2={20} {...STROKE_PROPS} />
      <line x1={140} y1={20} x2={140} y2={45} {...STROKE_PROPS} />

      {/* Corps progressif */}
      {visibleParts.map((part) => renderPart(part))}
    </svg>
  );
}