import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import type { RootState } from 'src/store';

const TOKEN_KEY = 'auth_token';

function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

interface AuthState {
  token: string | null;
}

const initialState: AuthState = {
  token: loadToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      localStorage.setItem(TOKEN_KEY, action.payload);
    },
    clearToken(state) {
      state.token = null;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
});

export const { setToken, clearToken } = authSlice.actions;

export const selectIsAuthenticated = (state: RootState) =>
  isTokenValid(state.auth.token);

export default authSlice.reducer;
