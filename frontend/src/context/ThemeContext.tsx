import { createContext, useContext, useState, type ReactNode } from "react";

const THEME_STORAGE_KEY = "theme";

export type Theme = 'light' | 'dark' | 'system';

// ─── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextInterface {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextInterface>({
  theme: "system",
  toggleTheme: () => {},
});

// ─── Hook d'accès simplifié ───────────────────────────────────────────────────
export const useTheme = () => useContext(ThemeContext);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }: { children: ReactNode }) => {

  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) ?? "system"
  );

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
