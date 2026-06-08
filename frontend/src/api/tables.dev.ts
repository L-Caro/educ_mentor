import type { TablesSessionResponse, TablesQuestion } from 'src/types';
import type { TablesSessionParams } from './tables.api';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateChoices(answer: number, count: number): number[] {
  const set = new Set([answer]);
  const offsets = shuffle([-3, -2, -1, 1, 2, 3, -6, 4, 5, -4, 6, -5, 7, -7, 8, -8]);
  for (const delta of offsets) {
    if (set.size >= count) break;
    const c = answer + delta;
    if (c > 0) set.add(c);
  }
  return shuffle([...set]);
}

export function generateTablesDevSession(params: TablesSessionParams): TablesSessionResponse {
  const { selectedTables, count = 10, choicesCount = 4, excludeTrivial = false } = params;

  const facts: [number, number][] = [];
  for (const t of selectedTables) {
    for (let i = 1; i <= 10; i++) {
      if (excludeTrivial && (t === 1 || i === 1)) continue;
      facts.push([t, i]);
    }
  }

  const questions: TablesQuestion[] = shuffle(facts)
    .slice(0, count)
    .map(([a, b]) => {
      const answer = a * b;
      return {
        fact_id: `${Math.min(a, b)}x${Math.max(a, b)}`,
        display_a: a,
        display_b: b,
        answer,
        choices: choicesCount > 0 ? generateChoices(answer, choicesCount) : [],
        hint: `${a} × ${b} = ${answer}`,
      };
    });

  return { session_id: 'dev', questions };
}