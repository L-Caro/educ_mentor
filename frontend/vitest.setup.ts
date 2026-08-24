/** Les specs de jeu importent le store Redux, dont un slice lit `localStorage` au chargement.
 * Les tests tournent sous Node : on fournit l'implémentation minimale attendue plutôt que
 * d'installer jsdom pour cette seule raison. */
const store = new Map<string, string>();

globalThis.localStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, String(value)),
  removeItem: (key: string) => void store.delete(key),
  clear: () => store.clear(),
  key: (index: number) => [...store.keys()][index] ?? null,
  get length() {
    return store.size;
  },
} as Storage;
