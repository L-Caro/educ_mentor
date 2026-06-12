import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux.ts';
import { setToken, clearToken, selectIsAuthenticated } from 'src/store/slice/authSlice';
import { useVerifyPinMutation } from 'src/store/api/authApi';

export function useAuth() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [verifyPin] = useVerifyPinMutation();

  const login = useCallback(async (pin: string): Promise<void> => {
    const { token } = await verifyPin({ pin }).unwrap();
    dispatch(setToken(token));
  }, [dispatch, verifyPin]);

  const logout = useCallback((): void => {
    dispatch(clearToken());
  }, [dispatch]);

  return { isAuthenticated, login, logout };
}
