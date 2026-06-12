import { useAppDispatch, useAppSelector } from 'src/hooks/redux';
import { toggleDevMode, selectIsDevMode } from 'src/store/slice/devModeSlice';

export function useDevMode() {
  const dispatch = useAppDispatch();
  const isDevMode = useAppSelector(selectIsDevMode);
  const toggle = () => dispatch(toggleDevMode());
  return { isDevMode, toggle };
}
