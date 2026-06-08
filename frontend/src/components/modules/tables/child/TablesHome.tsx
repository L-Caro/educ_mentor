import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTableStatus } from 'src/api/tables.api';
import { getSettingsMap } from 'src/api/settings.api';
import type { TableStatus } from 'src/types';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';

function tableStatusClass(status: TableStatus): string {
  if (status.is_known || status.mastered_count >= status.total_facts) {
    return 'TablesHome__tableBtn--mastered';
  }
  if (status.in_progress_count > 0 || status.mastered_count > 0) {
    return 'TablesHome__tableBtn--inProgress';
  }
  return 'TablesHome__tableBtn--notStarted';
}

function tableBadge(status: TableStatus): string {
  if (status.is_known) return '✓';
  if (status.mastered_count >= status.total_facts) return '★';
  if (status.mastered_count > 0 || status.in_progress_count > 0) return '…';
  return '';
}

export default function TablesHome() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<TableStatus[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getTableStatus(), getSettingsMap()])
      .then(([s, settingsMap]) => {
        if (!isMounted) return;
        setStatuses(s);
        setSettings(settingsMap);
      })
      .catch(console.error)
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const excludeTrivial = settings.tables_include_trivial === 'false';
  const visibleStatuses = excludeTrivial
    ? statuses.filter((s) => s.table > 1)
    : statuses;

  function toggleTable(t: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  function handleStart() {
    const tables = selected.size > 0
      ? [...selected]
      : visibleStatuses.map((s) => s.table);

    const choiceCount = settings.tables_choice_count ?? '4';
    const choicesCount = choiceCount === 'free' ? 0 : parseInt(choiceCount, 10);
    const hintsEnabled = settings.tables_hints_enabled !== 'false';
    const count = parseInt(settings.tables_questions_per_session ?? '10', 10);

    const params = new URLSearchParams({
      tables: tables.join(','),
      count: String(count),
      choices_count: String(choicesCount),
      hints: String(hintsEnabled),
      exclude_trivial: String(excludeTrivial),
    });
    navigate(`/module/tables/play?${params.toString()}`);
  }

  if (loading) {
    return (
      <PageContainer className="TablesHome">
        <div className="TablesHome__loading"><Spinner /></div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="TablesHome">
      <p className="TablesHome__subtitle">Quelles tables veux-tu travailler ?</p>

      <div className="TablesHome__grid">
        {visibleStatuses.map((s) => {
          const isSelected = selected.has(s.table);
          const badge = tableBadge(s);
          return (
            <button
              key={s.table}
              className={`TablesHome__tableBtn ${tableStatusClass(s)}${isSelected ? ' TablesHome__tableBtn--selected' : ''}`}
              onClick={() => toggleTable(s.table)}
              aria-pressed={isSelected}
            >
              <span className="TablesHome__tableBtnLabel">×{s.table}</span>
              {badge && <span className="TablesHome__tableBtnBadge">{badge}</span>}
            </button>
          );
        })}
      </div>

      <div className="TablesHome__legend">
        <span><span className="TablesHome__legendDot TablesHome__legendDot--mastered" />Connue / maîtrisée</span>
        <span><span className="TablesHome__legendDot TablesHome__legendDot--inProgress" />En cours</span>
        <span><span className="TablesHome__legendDot TablesHome__legendDot--notStarted" />Non commencée</span>
      </div>

      <Button
        className="TablesHome__startBtn"
        onClick={handleStart}
        title={selected.size === 0 ? 'Jouer (toutes les tables)' : `Jouer (${selected.size} table${selected.size > 1 ? 's' : ''})`}
      />
    </PageContainer>
  );
}
