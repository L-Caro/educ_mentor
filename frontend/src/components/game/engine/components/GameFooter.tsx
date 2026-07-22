import Button from 'src/components/common/Button.tsx';

interface GameFooterProps {
  onTerminate: () => void;
  onValidate: () => void;
  isValidateDisabled: boolean;
  validateLabel?: string;
}

export default function GameFooter({ onTerminate, onValidate, isValidateDisabled, validateLabel = '✓ Valider' }: GameFooterProps) {
  return (
    <div className="GameFooter">
      <Button variant="ghost" onClick={onTerminate}>Terminer</Button>
      <Button
        title={validateLabel}
        onClick={onValidate}
        onMouseDown={(event) => event.preventDefault()}
        disabled={isValidateDisabled}
      />
    </div>
  );
}
