import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from 'src/components/common/Spinner.tsx';
import { useModuleMeta } from 'src/hooks';
import { MODULES } from 'src/modules.manifest.tsx';
import type { ModuleManifest, ProgressionStat } from 'src/modules.manifest.tsx';

const SHORTCUTS = [
  { to: '/admin/modules', icon: '🧩', label: 'Modules', desc: 'Activer / désactiver les modules' },
  { to: '/settings', icon: '⚙️', label: 'Paramètres', desc: 'Options de jeu' },
];

interface ProgressionSummary {
  mastered: number;
  inProgress: number;
  accuracy: number | null;
}

function computeStats(items: ProgressionStat[]): ProgressionSummary {
  const seen = items.filter((item) => item.correct_count > 0 || item.incorrect_count > 0);
  const mastered = seen.filter((item) => item.is_mastered).length;
  const inProgress = seen.filter((item) => !item.is_mastered).length;
  const totalCorrect = seen.reduce((sum, item) => sum + item.correct_count, 0);
  const totalAttempts = seen.reduce((sum, item) => sum + item.correct_count + item.incorrect_count, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;
  return { mastered, inProgress, accuracy };
}

export default function AdminDashboard() {
  const getModuleMeta = useModuleMeta();
  const [statsMap, setStatsMap] = useState<Partial<Record<string, ProgressionSummary>>>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async (): Promise<Partial<Record<string, ProgressionSummary>>> => {
    const entries = await Promise.all(
      MODULES.map(async (module): Promise<[string, ProgressionSummary | undefined]> => {
        if (!module.progression) return [module.id, undefined];
        const items = await module.progression.getStats().catch(() => []);
        return [module.id, computeStats(items)];
      }),
    );
    return Object.fromEntries(entries);
  }, []);

  useEffect(() => {
    fetchStats().then((map) => { setStatsMap(map); setLoading(false); });
  }, [fetchStats]);

  async function handleReset(module: ModuleManifest) {
    if (!module.progression) return;
    const moduleName = getModuleMeta(module.id)?.name ?? module.id;
    if (!confirm(`Réinitialiser toute la progression ${moduleName} ? Action irréversible.`)) return;
    await module.progression.reset();
    setStatsMap(await fetchStats());
  }

  return (
    <div className="AdminDashboard">
      <h2 className="AdminDashboard__title">Tableau de bord</h2>
      <p className="AdminDashboard__subtitle">Bienvenue dans l'administration d'ÉducMentor.</p>

      <div className="AdminDashboard__grid">
        {SHORTCUTS.map((shortcut) => (
          <Link key={shortcut.to} to={shortcut.to} className="AdminDashboard__card">
            <span className="AdminDashboard__cardIcon">{shortcut.icon}</span>
            <div>
              <p className="AdminDashboard__cardLabel">{shortcut.label}</p>
              <p className="AdminDashboard__cardDesc">{shortcut.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="AdminDashboard__progression">
        <p className="AdminDashboard__progressionTitle">Progression</p>

        {loading ? (
          <Spinner size="sm" />
        ) : (
          <div className="AdminDashboard__modules">
            {MODULES.map((module) => {
              const stats = statsMap[module.id];
              const hasData = stats !== undefined && (stats.mastered > 0 || stats.inProgress > 0);

              return (
                <div key={module.id} className="AdminDashboard__module">
                  <div className="AdminDashboard__moduleHeader">
                    <span className="AdminDashboard__moduleIcon">{getModuleMeta(module.id)?.icon}</span>
                    <p className="AdminDashboard__moduleLabel">{getModuleMeta(module.id)?.name ?? module.id}</p>
                  </div>

                  {hasData ? (
                    <>
                      <div className="AdminDashboard__moduleBadges">
                        <span className="AdminBadge AdminBadge--success">{stats.mastered} maîtrisés</span>
                        <span className="AdminBadge AdminBadge--warning">{stats.inProgress} en cours</span>
                      </div>
                      {stats.accuracy !== null && (
                        <p className="AdminDashboard__moduleAccuracy">Précision : {stats.accuracy}%</p>
                      )}
                    </>
                  ) : (
                    <p className="AdminDashboard__moduleEmpty">Aucune session jouée</p>
                  )}

                  <button
                    className="AdminBtn AdminBtn--danger-ghost AdminDashboard__moduleReset"
                    onClick={() => handleReset(module)}
                    disabled={!hasData}
                  >
                    Réinitialiser
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
