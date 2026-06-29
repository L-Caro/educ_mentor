import { useMemo, useState } from 'react';
import { useGetModulesQuery } from 'src/store/api/sharedApi.ts';
import ModuleCard from 'src/components/common/ModuleCard.tsx';
import Spinner from 'src/components/common/Spinner.tsx';
import SessionTimerDisplay from 'src/components/common/SessionTimerDisplay.tsx';
import { MODULES } from 'src/modules.manifest';
import type { ModuleCategory } from 'src/types/modules.types';

// ─── Méta des catégories ──────────────────────────────────────────────────────

const CATEGORY_META: Record<ModuleCategory, { label: string; emoji: string }> = {
  maths:    { label: 'Maths',      emoji: '🔢' },
  francais: { label: 'Français',   emoji: '✍️' },
  geo:      { label: 'Géographie', emoji: '🌍' },
  anglais:  { label: 'Anglais',    emoji: '🇬🇧' },
  jeux:     { label: 'Jeux',       emoji: '🎮' },
};

// Ordre d'affichage des boutons filtres
const CATEGORY_ORDER: ModuleCategory[] = ['maths', 'francais', 'geo', 'anglais', 'jeux'];

// ─── Composant ────────────────────────────────────────────────────────────────

export default function HomeLayout() {
  const { data: modules = [], isLoading: loading } = useGetModulesQuery({ onlyActive: true });
  const [activeFilter, setActiveFilter] = useState<ModuleCategory | null>(null);

  // Map id → category, construite une seule fois depuis le manifest frontend
  const categoryMap = useMemo(
    () => new Map(MODULES.map((m) => [m.id, m.category ?? null])),
    [],
  );

  // Catégories effectivement présentes parmi les modules actifs (dans l'ordre CATEGORY_ORDER)
  const availableCategories = useMemo((): ModuleCategory[] => {
    const seen = new Set<ModuleCategory>();
    for (const mod of modules) {
      const cat = categoryMap.get(mod.id);
      if (cat) seen.add(cat);
    }
    return CATEGORY_ORDER.filter((c) => seen.has(c));
  }, [modules, categoryMap]);

  // Modules visibles selon le filtre actif
  const visibleModules = useMemo(
    () => activeFilter
      ? modules.filter((mod) => categoryMap.get(mod.id) === activeFilter)
      : modules,
    [modules, activeFilter, categoryMap],
  );

  if (loading) {
    return (
      <div className="HomeLayout">
        <div className="HomeLayout__loading">
          <Spinner />
        </div>
      </div>
    );
  }

  if (modules.length === 0) {
    return (
      <div className="HomeLayout">
        <p className="HomeLayout__empty">
          Aucun module activé pour l&apos;instant.
        </p>
      </div>
    );
  }

  return (
    <div className="HomeLayout">
      <div className="HomeLayout__timerRow">
        <SessionTimerDisplay />
      </div>

      {availableCategories.length > 1 && (
        <div className="HomeLayout__filters">
          <button
            className={`HomeLayout__filterBtn${activeFilter === null ? ' HomeLayout__filterBtn--active' : ''}`}
            onClick={() => setActiveFilter(null)}
          >
            Tous
          </button>
          {availableCategories.map((cat) => (
            <button
              key={cat}
              className={`HomeLayout__filterBtn${activeFilter === cat ? ' HomeLayout__filterBtn--active' : ''}`}
              onClick={() => setActiveFilter((prev) => (prev === cat ? null : cat))}
            >
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </button>
          ))}
        </div>
      )}

      <div className="HomeLayout__grid">
        {visibleModules.map((mod) => (
          <div key={mod.id} className="HomeLayout__col">
            <ModuleCard module={mod} />
          </div>
        ))}
      </div>
    </div>
  );
}
