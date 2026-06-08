import { type ReactNode } from 'react';
import Button from 'src/components/common/Button';

interface GameFooterProps {
  onTerminate: () => void;
  children?: ReactNode;
}

export default function GameFooter({ onTerminate, children }: GameFooterProps) {
  return (
    <div className="GameFooter">
      <Button variant="ghost" onClick={onTerminate}>Terminer</Button>
      {children}
    </div>
  );
}
