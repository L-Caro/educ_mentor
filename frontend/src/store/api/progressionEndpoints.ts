import type { ProgressionStat, ModuleManifest } from 'src/types/modules.types';
import store from 'src/store';

type ProgressionEntry = NonNullable<ModuleManifest['progression']>;

// Les endpoints RTK Query exposent un typage interne très profond lié à leur définition.
// `any` est justifié ici pour isoler ce point d'adaptation sans faire fuiter toute la
// chaîne de types RTK Query (QueryActionCreator, QueryDefinition…) dans les descripteurs.
/* eslint-disable @typescript-eslint/no-explicit-any */
interface ProgressionEndpoints {
  getEndpoint: { initiate: (arg: undefined, opts: { forceRefetch: boolean }) => any };
  resetEndpoint: { initiate: () => any };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Génère l'entrée `progression` d'un descripteur de module à partir des deux endpoints
 * RTK Query du module. Factorise le `store.dispatch` boilerplate identique partout.
 *
 * Usage : `buildProgressionEntry(xApi.endpoints.getXProgression, xApi.endpoints.resetXProgression)` */
export function buildProgressionEntry(
  endpoints: ProgressionEndpoints,
): ProgressionEntry {
  return {
    getStats: (): Promise<ProgressionStat[]> =>
      store.dispatch(endpoints.getEndpoint.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async (): Promise<void> => {
      await store.dispatch(endpoints.resetEndpoint.initiate()).unwrap();
    },
  };
}
