import { createContext, useContext, useState, type ReactNode } from "react";

const THEME_STORAGE_KEY = "theme";

// ─── Typage ───────────────────────────────────────────────────────────────────
interface ThemeContextInterface {
  theme: string;
  toggleTheme: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
export const ThemeContext = createContext<ThemeContextInterface>({
  theme: "dark",
  toggleTheme: () => {},
});

// ─── Hook d'accès simplifié ───────────────────────────────────────────────────
export const useTheme = () => useContext(ThemeContext);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }: { children: ReactNode }) => {

  const [theme, setTheme] = useState<string>(
    () => localStorage.getItem(THEME_STORAGE_KEY) ?? "dark"
  );

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";

    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
