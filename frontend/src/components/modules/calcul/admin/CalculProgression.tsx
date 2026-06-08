import { useEffect, useState } from 'react';
import {
  getCalculProgression,
  getCalculSessions,
  resetCalculProgression,
} from 'src/api/calcul.api';
import type { CalculProgression, CalculSession } from 'src/types';
import Spinner from 'src/components/common/Spinner';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function pct(correct: number | null, total: number | null): string {
  if (!total || total === 0) return '—';
  return `${Math.round(((correct ?? 0) / total) * 100)}%`;
}

export default function CalculProgressionView() {
  const [progression, setProgression] = useState<CalculProgression[]>([]);
  const [sessions, setSessions] = useState<CalculSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [prog, sess] = await Promise.all([getCalculProgression(), getCalculSessions()]);
    setProgression(prog);
    setSessions(sess);
    setLoading(false);
  }

  async function handleReset() {
    if (!confirm('Réinitialiser toute la progression et les sessions ? Action irréversible.')) return;
    await resetCalculProgression();
    await load();
  }

  const seen = progression.filter((p) => p.correct_count > 0 || p.incorrect_count > 0);
  const mastered = seen.filter((p) => p.is_mastered).length;
  const hardest = [...seen]
    .sort((a, b) => b.incorrect_count - a.incorrect_count)
    .slice(0, 10)
    .filter((p) => p.incorrect_count > 0);

  const completedSessions = sessions.filter((s) => s.completed_at);

  return (
    <div className="CalculProgression">
      <div className="CalculProgression__header">
        <div className="CalculProgression__stats">
          <span className="AdminBadge AdminBadge--success">{mastered} valeurs maîtrisées</span>
          <span className="AdminBadge AdminBadge--warning">{seen.length - mastered} en cours</span>
          <span className="AdminBadge AdminBadge--neutral">{completedSessions.length} sessions jouées</span>
        </div>
        <button onClick={handleReset} className="AdminBtn AdminBtn--danger">
          Réinitialiser
        </button>
      </div>

      {loading ? (
        <Spinner size="sm" />
      ) : (
        <>
          {/* Dernières sessions */}
          {completedSessions.length > 0 && (
            <div className="CalculProgression__section">
              <p className="CalculProgression__sectionTitle">Dernières sessions</p>
              <div className="AdminTable">
                <div className="AdminTable__wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Plage</th>
                        <th>Timer</th>
                        <th style={{ textAlign: 'center' }}>Score</th>
                        <th style={{ textAlign: 'center' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedSessions.slice(0, 15).map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontSize: '0.82rem', opacity: 0.7 }}>{formatDate(s.started_at)}</td>
                          <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {s.min_value > 0 ? `${s.min_value} → ${s.max_value}` : `→ ${s.max_value}`}
                          </td>
                          <td style={{ opacity: 0.6 }}>
                            {s.timer_seconds > 0 ? `${s.timer_seconds}s` : '∞'}
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>
                            {s.correct_answers ?? '—'} / {s.total_questions ?? '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`AdminBadge ${
                              (s.correct_answers ?? 0) / (s.total_questions ?? 1) >= 0.8
                                ? 'AdminBadge--success'
                                : (s.correct_answers ?? 0) / (s.total_questions ?? 1) >= 0.5
                                ? 'AdminBadge--warning'
                                : 'AdminBadge--danger'
                            }`}>
                              {pct(s.correct_answers, s.total_questions)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Points difficiles */}
          {hardest.length > 0 && (
            <div className="CalculProgression__section">
              <p className="CalculProgression__sectionTitle">Valeurs les plus difficiles</p>
              <div className="AdminTable">
                <div className="AdminTable__wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre manquant</th>
                        <th style={{ textAlign: 'center' }}>✅ Correct</th>
                        <th style={{ textAlign: 'center' }}>❌ Raté</th>
                        <th>Précision</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hardest.map((p) => {
                        const total = p.correct_count + p.incorrect_count;
                        const accuracy = total === 0 ? 0 : Math.round((p.correct_count / total) * 100);
                        return (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 700, fontSize: '1.1rem' }}>{p.answer_value}</td>
                            <td style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>
                              {p.correct_count}
                            </td>
                            <td style={{ textAlign: 'center', color: 'var(--color-error)', fontWeight: 600 }}>
                              {p.incorrect_count}
                            </td>
                            <td>{accuracy}%</td>
                            <td>
                              {p.is_mastered
                                ? <span className="AdminBadge AdminBadge--success">Maîtrisé</span>
                                : <span className="AdminBadge AdminBadge--warning">En cours</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {seen.length === 0 && completedSessions.length === 0 && (
            <p className="CalculProgression__empty">Aucune session jouée pour l'instant.</p>
          )}
        </>
      )}
    </div>
  );
}
