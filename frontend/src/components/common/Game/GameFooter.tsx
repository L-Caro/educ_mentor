import Button from 'src/components/common/Button.tsx';

interface GameFooterProps {
  onTerminate: () => void;
  onValidate: () => void;
  isValidateDisabled: boolean;
}

export default function GameFooter({ onTerminate, onValidate, isValidateDisabled }: GameFooterProps) {
  return (
    <div className="GameFooter">
      <Button variant="ghost" onClick={onTerminate}>Terminer</Button>
      <Button title="✓ Valider" onClick={onValidate} disabled={isValidateDisabled} />
    </div>
  );
}
