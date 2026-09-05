import { useGetModulesQuery } from 'src/store/api/sharedApi';

export interface ModuleMeta {
  name: string;
  icon: string;
}

/**
 * Métadonnées catalogue (label/icon) d'un module par id : **source unique = backend**.
 * Les surfaces (header, layout admin, dashboard, sidebar) résolvent leur libellé ainsi
 * plutôt que de le redéclarer côté front.
 */
export function useModuleMetaResolver() {
  const { data: modules } = useGetModulesQuery();
  return (id: string): ModuleMeta | undefined => {
    const found = modules?.find((module) => module.id === id);
    return found ? { name: found.name, icon: found.icon } : undefined;
  };
}
