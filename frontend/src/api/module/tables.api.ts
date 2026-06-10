import client from '../client.ts';
import type { TablesSessionResponse, TablesProgression } from '../../types';

// ─── Session (jeu) ────────────────────────────────────────────────────────────

export async function startTablesSession(selectedTables: number[]): Promise<TablesSessionResponse> {
  const { data } = await client.post<TablesSessionResponse>('/tables/session', {
    selected_tables: selectedTables,
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

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getTablesProgression(): Promise<TablesProgression[]> {
  const { data } = await client.get<TablesProgression[]>('/tables/progression');
  return data;
}

export async function resetTablesProgression(): Promise<void> {
  await client.delete('/tables/progression');
}
