import client from './client';
import type { AppModule } from '../types';

export async function getModules(onlyActive = false): Promise<AppModule[]> {
  const { data } = await client.get<AppModule[]>('/catalog/modules', {
    params: onlyActive ? { active: 'true' } : {},
  });
  return data;
}

export async function updateModule(
  id: string,
  payload: { is_active?: boolean; display_order?: number },
): Promise<AppModule> {
  const { data } = await client.patch<AppModule>(`/catalog/modules/${id}`, payload);
  return data;
}
