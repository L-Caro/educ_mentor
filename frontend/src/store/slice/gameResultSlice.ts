import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GameResultEntry } from 'src/types/game.types';
import type { RootState } from 'src/store';

export interface GameResult {
  correctCount: number;
  total?: number;
  scoreLabel?: string;
  results: GameResultEntry[];
}

const gameResultSlice = createSlice({
  name: 'gameResult',
  initialState: { current: null as GameResult | null },
  reducers: {
    setGameResult(state, action: PayloadAction<GameResult>) {
      state.current = action.payload;
    },
    clearGameResult(state) {
      state.current = null;
    },
  },
});

export const { setGameResult, clearGameResult } = gameResultSlice.actions;
export const selectGameResult = (state: RootState) => state.gameResult.current;
export default gameResultSlice.reducer;
