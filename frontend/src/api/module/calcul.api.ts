import client from '../client.ts';
import type { CalculSessionResponse, CalculProgression, CalculSession } from 'src/types';

export async function startCalculSession(): Promise<CalculSessionResponse> {
  const { data } = await client.post<CalculSessionResponse>('/calcul/session');
  return data;
}

export async function recordCalculAnswer(
  sessionId: string,
  answerValue: number,
  isCorrect: boolean,
): Promise<void> {
  await client.post(`/calcul/session/${sessionId}/answer`, {
    answer_value: answerValue,
    is_correct: isCorrect,
  });
}

export async function completeCalculSession(
  sessionId: string,
  correctAnswers: number,
  totalQuestions: number,
): Promise<void> {
  await client.post(`/calcul/session/${sessionId}/complete`, {
    correct_answers: correctAnswers,
    total_questions: totalQuestions,
  });
}

export async function getCalculProgression(): Promise<CalculProgression[]> {
  const { data } = await client.get<CalculProgression[]>('/calcul/progression');
  return data;
}

export async function getCalculSessions(): Promise<CalculSession[]> {
  const { data } = await client.get<CalculSession[]>('/calcul/sessions');
  return data;
}

export async function resetCalculProgression(): Promise<void> {
  await client.delete('/calcul/progression');
}
