import { useState } from 'react';

const STORAGE_KEY = 'maeve_dev_mode';

export function useDevMode() {
  const [isDevMode, setIsDevMode] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  const toggle = () =>
    setIsDevMode((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });

  return { isDevMode, toggle };
}