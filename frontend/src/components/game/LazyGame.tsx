import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameEngine, { type GameModuleSpec } from './engine/GameEngine.tsx';
import GameStateView from './engine/GameStateView.tsx';

interface LazyGameProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<GameModuleSpec<any, any>>;
  moduleId: string;
}

/** Charge dynamiquement la spec d'un module (code-splitting) puis rend le moteur. */
export default function LazyGame({ load, moduleId }: LazyGameProps) {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [spec, setSpec] = useState<GameModuleSpec<any, any> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    load()
      .then((loaded) => { if (isMounted) setSpec(loaded); })
      .catch(() => { if (isMounted) setFailed(true); });
    return () => { isMounted = false; };
  }, [load]);

  if (failed) {
    return <GameStateView errorMessage="Impossible de charger le module." onBack={() => navigate('/')} />;
  }
  if (!spec) {
    return <GameStateView loading onBack={() => navigate(`/module/${moduleId}`)} />;
  }
  return <GameEngine spec={spec} moduleId={moduleId} />;
}
