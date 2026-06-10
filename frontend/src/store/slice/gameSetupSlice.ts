import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from 'src/store';

/** Choix de session éphémères d'un module (catégories, type d'exercice, tables…). */
export type ModuleSetup = Record<string, string | string[]>;

interface GameSetupState {
  byModule: Record<string, ModuleSetup>;
}

const STORAGE_KEY = 'maeve_game_setup';

function loadByModule(): Record<string, ModuleSetup> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ModuleSetup>) : {};
  } catch {
    return {};
  }
}

const initialState: GameSetupState = { byModule: loadByModule() };

const gameSetupSlice = createSlice({
  name: 'gameSetup',
  initialState,
  reducers: {
    setModuleSetup(state, action: PayloadAction<{ moduleId: string; setup: ModuleSetup }>) {
      state.byModule[action.payload.moduleId] = action.payload.setup;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.byModule));
    },
  },
});

export const { setModuleSetup } = gameSetupSlice.actions;

/** Sélecteur factory : le dernier setup persisté pour ce module (undefined si jamais joué). */
export const selectModuleSetup =
  (moduleId: string) =>
  (state: RootState): ModuleSetup | undefined =>
    state.gameSetup.byModule[moduleId];

export default gameSetupSlice.reducer;
