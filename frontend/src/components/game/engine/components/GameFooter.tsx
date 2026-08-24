import Button from 'src/components/common/Button.tsx';

interface GameFooterProps {
  onTerminate: () => void;
  onValidate: () => void;
  isValidateDisabled: boolean;
  validateLabel?: string;
  /** Action facultative entre « Terminer » et le bouton principal (ex : ouvrir la leçon). */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function GameFooter({
  onTerminate,
  onValidate,
  isValidateDisabled,
  validateLabel = '✓ Valider',
  secondaryLabel,
  onSecondary,
}: GameFooterProps) {
  return (
    <div className="GameFooter">
      <Button variant="ghost" onClick={onTerminate}>Terminer</Button>
      {secondaryLabel && onSecondary && (
        <Button variant="ghost" onClick={onSecondary}>{secondaryLabel}</Button>
      )}
      <Button
        title={validateLabel}
        onClick={onValidate}
        onMouseDown={(event) => event.preventDefault()}
        disabled={isValidateDisabled}
      />
    </div>
  );
}
