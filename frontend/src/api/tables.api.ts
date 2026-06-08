import client from './client';
import type { TablesSessionResponse, TablesProgression, TableStatus } from '../types';

// ─── Session (jeu) ────────────────────────────────────────────────────────────

export interface TablesSessionParams {
  selectedTables: number[];
  count?: number;
  choicesCount?: number; // 0 = free input, 2 or 4 = QCM
  excludeTrivial?: boolean;
}

export async function startTablesSession(
  params: TablesSessionParams,
): Promise<TablesSessionResponse> {
  const { data } = await client.get<TablesSessionResponse>('/tables/session', {
    params: {
      selected_tables: params.selectedTables.join(','),
      ...(params.count !== undefined ? { count: params.count } : {}),
      ...(params.choicesCount !== undefined ? { choices_count: params.choicesCount } : {}),
      ...(params.excludeTrivial !== undefined ? { exclude_trivial: params.excludeTrivial } : {}),
    },
  });
  return data;
}

export async function recordTablesAnswer(
  sessionId: string,
  factorA: number,
  factorB: number,
  isCorrect: boolean,
): Promise<void> {
  await client.post(`/tables/session/${sessionId}/answer`, {
    factor_a: factorA,
    factor_b: factorB,
    is_correct: isCorrect,
  });
}

export async function completeTablesSession(
  sessionId: string,
  correctAnswers: number,
  totalQuestions: number,
): Promise<void> {
  await client.post(`/tables/session/${sessionId}/complete`, {
    correct_answers: correctAnswers,
    total_questions: totalQuestions,
  });
}

// ─── Status (vue enfant) ──────────────────────────────────────────────────────

export async function getTableStatus(): Promise<TableStatus[]> {
  const { data } = await client.get<TableStatus[]>('/tables/status');
  return data;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getTablesProgression(): Promise<TablesProgression[]> {
  const { data } = await client.get<TablesProgression[]>('/tables/progression');
  return data;
}

export async function resetTablesProgression(): Promise<void> {
  await client.delete('/tables/progression');
}
