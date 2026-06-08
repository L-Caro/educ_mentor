import client from './client';
import type { Setting } from '../types';

export async function getAllSettings(): Promise<Setting[]> {
  const { data } = await client.get<Setting[]>('/settings');
  return data;
}

export async function updateSetting(key: string, value: string): Promise<Setting> {
  const { data } = await client.patch<Setting>(`/settings/${key}`, { value });
  return data;
}

// Helper : retourne un objet { key: value } pour accès facile
export async function getSettingsMap(): Promise<Record<string, string>> {
  const settings = await getAllSettings();
  return Object.fromEntries(settings.map((s) => [s.key, s.value]));
}
