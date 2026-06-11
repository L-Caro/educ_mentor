import client from '../client.ts';
import type { ImagierWord, ImagierSessionResponse } from '../../types';

// ─── Session (jeu) ────────────────────────────────────────────────────────────

export async function startSession(categories?: string[], difficulty?: string): Promise<ImagierSessionResponse> {
  const { data } = await client.post<ImagierSessionResponse>('/imagier/session', { categories, difficulty });
  return data;
}

export async function recordAnswer(
  sessionId: string,
  wordId: string,
  isCorrect: boolean,
): Promise<void> {
  await client.post(`/imagier/session/${sessionId}/answer`, {
    word_id: wordId,
    is_correct: isCorrect,
  });
}

export async function completeSession(
  sessionId: string,
  correctAnswers: number,
  totalQuestions: number,
): Promise<void> {
  await client.post(`/imagier/session/${sessionId}/complete`, {
    correct_answers: correctAnswers,
    total_questions: totalQuestions,
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getWords(filters?: {
  category?: string;
  is_active?: boolean;
  search?: string;
}): Promise<ImagierWord[]> {
  const { data } = await client.get<ImagierWord[]>('/imagier/words', { params: filters });
  return data;
}

export async function createWord(dto: {
  fr: string;
  en: string;
  category: string;
  subcategory?: string;
  is_active?: boolean;
}): Promise<ImagierWord> {
  const { data } = await client.post<ImagierWord>('/imagier/words', dto);
  return data;
}

export async function updateWord(
  id: string,
  dto: Partial<ImagierWord>,
): Promise<ImagierWord> {
  const { data } = await client.patch<ImagierWord>(`/imagier/words/${id}`, dto);
  return data;
}

export async function deleteWord(id: string): Promise<void> {
  await client.delete(`/imagier/words/${id}`);
}

export async function getCategories(): Promise<
  { category: string; count: number; active_count: number }[]
> {
  const { data } = await client.get<
    { category: string; count: number; active_count: number }[]
  >('/imagier/categories');
  return data;
}

export async function importJson(
  json: string,
  overwrite = false,
): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const { data } = await client.post('/imagier/import', { json, overwrite });
  return data;
}

export async function getProgression(): Promise<
  (ImagierWord & {
    progression: {
      correct_count: number;
      incorrect_count: number;
      is_mastered: boolean;
    } | null;
  })[]
> {
  const { data } = await client.get('/imagier/progression');
  return data;
}

export async function resetProgression(): Promise<void> {
  await client.delete('/imagier/progression');
}

export async function normalizeCategories(): Promise<{ updated: number }> {
  const { data } = await client.patch<{ updated: number }>('/imagier/normalize-categories');
  return data;
}

export async function uploadWordImage(
  wordId: string,
  file: File,
): Promise<ImagierWord> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post<ImagierWord>(
    `/imagier/words/${wordId}/image`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
