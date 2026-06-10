import { useEffect, useMemo, useState } from 'react';
import { getModules } from 'src/api/catalog.api';
import ModuleCard from 'src/components/common/Game/ModuleCard.tsx';
import Spinner from 'src/components/common/Spinner';
import SessionTimerDisplay from 'src/components/common/SessionTimerDisplay';
import type { AppModule } from 'src/types';

export default function ChildHome() {
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getModules(true)
    .then((data) => {
      if (isMounted) {
        setModules(data);
      }
    })
    .finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const hasModules = useMemo(() => modules.length > 0, [modules]);

  if (loading) {
    return (
      <div className="ChildHome">
        <div className="ChildHome__loading">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!hasModules) {
    return (
      <div className="ChildHome">
        <p className="ChildHome__empty">
          Aucun module activé pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <div className="ChildHome">
      <div className="ChildHome__timerRow">
        <SessionTimerDisplay />
      </div>
      <div className="ChildHome__grid">
        {modules.map((mod) => (
          <div key={mod.id} className="ChildHome__col">
            <ModuleCard module={mod} />
          </div>
        ))}
      </div>
    </div>
  );
}