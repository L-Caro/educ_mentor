import client from './client';

export async function verifyPin(pin: string): Promise<string> {
  const { data } = await client.post<{ token: string }>('/auth/verify-pin', { pin });
  return data.token;
}

export async function changePin(currentPin: string, newPin: string): Promise<void> {
  await client.post('/auth/change-pin', { currentPin, newPin });
}
