import client from '../client.ts';
import type { MonnaieSessionResponse, MonnaieSession } from 'src/types';

export async function startMonnaieSession(exerciseType: string, difficulty?: string): Promise<MonnaieSessionResponse> {
  const { data } = await client.post<MonnaieSessionResponse>('/monnaie/session', { exercise_type: exerciseType, difficulty });
  return data;
}

export async function recordMonnaieAnswer(
  sessionId: string,
  exerciseType: string,
  answerValue: number,
  isCorrect: boolean,
): Promise<void> {
  await client.post(`/monnaie/session/${sessionId}/answer`, {
    exercise_type: exerciseType,
    answer_value: answerValue,
    is_correct: isCorrect,
  });
}

export async function completeMonnaieSession(
  sessionId: string,
  correctAnswers: number,
  totalQuestions: number,
): Promise<void> {
  await client.post(`/monnaie/session/${sessionId}/complete`, {
    correct_answers: correctAnswers,
    total_questions: totalQuestions,
  });
}

export async function getMonnaieSessions(): Promise<MonnaieSession[]> {
  const { data } = await client.get<MonnaieSession[]>('/monnaie/sessions');
  return data;
}
