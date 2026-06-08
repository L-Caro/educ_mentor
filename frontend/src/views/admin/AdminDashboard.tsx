import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProgression as getImagierProgression, resetProgression as resetImagierProgression } from 'src/api/imagier.api';
import { getCalculProgression, resetCalculProgression } from 'src/api/calcul.api';
import { getTablesProgression, resetTablesProgression } from 'src/api/tables.api';
import { getMonnaieProgression, resetMonnaieProgression } from 'src/api/monnaie.api';
import Spinner from 'src/components/common/Spinner';

const SHORTCUTS = [
  { to: '/admin/modules', icon: '🧩', label: 'Modules', desc: 'Activer / désactiver les modules' },
  { to: '/settings', icon: '⚙️', label: 'Paramètres', desc: 'Options de jeu' },
];

interface ProgressionStats {
  mastered: number;
  inProgress: number;
  accuracy: number | null;
}

interface ModuleDef {
  id: string;
  label: string;
  icon: string;
}

const MODULE_DEFS: ModuleDef[] = [
  { id: 'imagier', label: 'Imagier Anglais', icon: '🇬🇧' },
  { id: 'tables', label: 'Tables', icon: '✖️' },
  { id: 'calcul', label: 'Calcul Mental', icon: '🧮' },
  { id: 'monnaie', label: 'Monnaie', icon: '💶' },
];

function computeStats(
  items: { is_mastered: boolean; correct_count: number; incorrect_count: number }[],
): ProgressionStats {
  const seen = items.filter((item) => item.correct_count > 0 || item.incorrect_count > 0);
  const mastered = seen.filter((item) => item.is_mastered).length;
  const inProgress = seen.filter((item) => !item.is_mastered).length;
  const totalCorrect = seen.reduce((sum, item) => sum + item.correct_count, 0);
  const totalAttempts = seen.reduce((sum, item) => sum + item.correct_count + item.incorrect_count, 0);
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;
  return { mastered, inProgress, accuracy };
}

export default function AdminDashboard() {
  const [statsMap, setStatsMap] = useState<Partial<Record<string, ProgressionStats>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);

    const [imagierItems, calculItems, tablesItems, monnaieItems] = await Promise.all([
      getImagierProgression().catch(() => []),
      getCalculProgression().catch(() => []),
      getTablesProgression().catch(() => []),
      getMonnaieProgression().catch(() => []),
    ]);

    const imagierStats = computeStats(
      imagierItems
        .filter((item) => item.progression !== null)
        .map((item) => item.progression!),
    );

    setStatsMap({
      imagier: imagierStats,
      calcul: computeStats(calculItems),
      tables: computeStats(tablesItems),
      monnaie: computeStats(monnaieItems),
    });

    setLoading(false);
  }

  async function handleReset(moduleId: string) {
    if (!confirm(`Réinitialiser toute la progression ${MODULE_DEFS.find((m) => m.id === moduleId)?.label} ? Action irréversible.`)) return;

    const resetFns: Record<string, () => Promise<void>> = {
      imagier: resetImagierProgression,
      calcul: resetCalculProgression,
      tables: resetTablesProgression,
      monnaie: resetMonnaieProgression,
    };

    await resetFns[moduleId]?.();
    await loadAll();
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
            {MODULE_DEFS.map((moduleDef) => {
              const stats = statsMap[moduleDef.id];
              const hasData = stats !== undefined && (stats.mastered > 0 || stats.inProgress > 0);

              return (
                <div key={moduleDef.id} className="AdminDashboard__module">
                  <div className="AdminDashboard__moduleHeader">
                    <span className="AdminDashboard__moduleIcon">{moduleDef.icon}</span>
                    <p className="AdminDashboard__moduleLabel">{moduleDef.label}</p>
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
                    onClick={() => handleReset(moduleDef.id)}
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
