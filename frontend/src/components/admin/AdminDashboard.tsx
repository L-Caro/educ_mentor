import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from 'src/components/common/Spinner.tsx';
import Toggle from 'src/components/common/Toggle.tsx';
import { useModuleMetaResolver } from 'src/hooks';
import { MODULES } from 'src/modules.manifest.tsx';
import type { ModuleManifest, ProgressionStat } from 'src/modules.manifest.tsx';
import { useGetModulesQuery, useUpdateModuleMutation } from 'src/store/api/sharedApi.ts';

const SHORTCUTS = [
  { to: '/settings', icon: '⚙️', label: 'Paramètres', desc: 'Options de jeu' },
];

interface ProgressionSummary {
  mastered: number;
  inProgress: number;
  accuracy: number | null;
  /** La requête a échoué : on ne sait RIEN, ce qui n'est pas la même chose que zéro. */
  indisponible?: true;
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
  const getModuleMeta = useModuleMetaResolver();
  const [statsMap, setStatsMap] = useState<Partial<Record<string, ProgressionSummary>>>({});
  const [loading, setLoading] = useState(true);
  const {
    data: catalogModules = [],
    isError: catalogueEnPanne,
    refetch: rechargerCatalogue,
  } = useGetModulesQuery();
  const [updateModule] = useUpdateModuleMutation();

  const fetchStats = useCallback(async (): Promise<Partial<Record<string, ProgressionSummary>>> => {
    const entries = await Promise.all(
      MODULES.map(async (module): Promise<[string, ProgressionSummary | undefined]> => {
        if (!module.progression) return [module.id, undefined];
        // Avaler l'erreur en rendant un tableau vide transformait une panne réseau en
        // « aucune donnée », et l'écran annonçait « Aucune session jouée » pour dix-huit
        // modules alors que le backend était mort. Ne pas savoir et savoir qu'il n'y a
        // rien sont deux états différents ; les confondre envoie chercher le problème au
        // mauvais endroit.
        try {
          return [module.id, computeStats(await module.progression.getStats())];
        } catch {
          return [
            module.id,
            { mastered: 0, inProgress: 0, accuracy: null, indisponible: true },
          ];
        }
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
        <p className="AdminDashboard__progressionTitle">Modules</p>

        {/* Sans catalogue, rien de ce qui suit n'est fiable : les noms et les icônes en
            viennent, et l'interrupteur ne s'affiche que si le module y est trouvé. Les
            cartes se dégradaient donc en silence — ids bruts, pas d'icône, pas
            d'interrupteur — ce qui ressemble à « rien n'est configuré » alors que la
            cause est « le serveur ne répond pas ». Mieux vaut le dire et ne rien
            afficher que présenter une liste dont on ne peut rien faire. */}
        {catalogueEnPanne ? (
          <div className="AdminDashboard__panne" role="alert">
            <p className="AdminDashboard__panneTitre">
              Impossible de joindre le serveur.
            </p>
            <p className="AdminDashboard__panneTexte">
              Le catalogue des modules n&apos;a pas pu être chargé : ni les noms, ni les
              icônes, ni les interrupteurs d&apos;activation ne sont disponibles. Rien
              n&apos;est perdu — vérifie que le backend tourne, puis recharge.
            </p>
            <button
              className="AdminBtn"
              onClick={() => void rechargerCatalogue()}
            >
              Recharger
            </button>
          </div>
        ) : loading ? (
          <Spinner size="sm" />
        ) : (
          <div className="AdminDashboard__modules">
            {MODULES.map((module) => {
              const stats = statsMap[module.id];
              const indisponible = stats?.indisponible === true;
              const hasData =
                stats !== undefined &&
                !indisponible &&
                (stats.mastered > 0 || stats.inProgress > 0);
              const catalogMod = catalogModules.find((m) => m.id === module.id);

              return (
                <div key={module.id} className="AdminDashboard__module">
                  <div className="AdminDashboard__moduleHeader">
                    <div className="AdminDashboard__moduleInfo">
                      <span className="AdminDashboard__moduleIcon">{getModuleMeta(module.id)?.icon}</span>
                      <p className="AdminDashboard__moduleLabel">{getModuleMeta(module.id)?.name ?? module.id}</p>
                    </div>
                    <div className="AdminDashboard__moduleControls">
                      {catalogMod && (
                        <Toggle
                          checked={catalogMod.is_active}
                          onChange={() => updateModule({ id: catalogMod.id, payload: { is_active: !catalogMod.is_active } })}
                        />
                      )}
                      {module.adminTabs && module.adminTabs.length > 0 && (
                        <Link
                          to={`/admin/${module.id}`}
                          className="AdminDashboard__moduleGear"
                          title="Configurer le module"
                        >
                          ⚙️
                        </Link>
                      )}
                    </div>
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
                  ) : indisponible ? (
                    <p className="AdminDashboard__moduleEmpty AdminDashboard__moduleEmpty--panne">
                      Progression indisponible
                    </p>
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
