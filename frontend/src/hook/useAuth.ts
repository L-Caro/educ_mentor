import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { setToken, clearToken, selectIsAuthenticated } from 'src/store/slice/authSlice';
import { verifyPin } from 'src/api/auth.api';

export function useAuth() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const login = useCallback(async (pin: string): Promise<void> => {
    const token = await verifyPin(pin);
    dispatch(setToken(token));
  }, [dispatch]);

  const logout = useCallback((): void => {
    dispatch(clearToken());
  }, [dispatch]);

  return { isAuthenticated, login, logout };
}
