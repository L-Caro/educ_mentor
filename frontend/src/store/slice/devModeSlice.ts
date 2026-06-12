import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from 'src/store';

const STORAGE_KEY = 'maeve_dev_mode';

const devModeSlice = createSlice({
  name: 'devMode',
  initialState: {
    enabled: localStorage.getItem(STORAGE_KEY) === 'true',
  },
  reducers: {
    toggleDevMode(state) {
      state.enabled = !state.enabled;
      localStorage.setItem(STORAGE_KEY, String(state.enabled));
    },
  },
});

export const { toggleDevMode } = devModeSlice.actions;
export const selectIsDevMode = (state: RootState) => state.devMode.enabled;
export default devModeSlice.reducer;
