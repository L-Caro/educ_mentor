/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";

// ─── Constante pour éviter les fautes de frappe sur la clé localStorage ───────
const THEME_STORAGE_KEY = "theme";

// ─── Typage ───────────────────────────────────────────────────────────────────
interface ThemeContextInterface {
  theme: string;
  toggleTheme: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
// La valeur par défaut n'est utilisée QUE si un composant consomme le context
// sans être enveloppé dans le Provider (cas d'erreur).
export const ThemeContext = createContext<ThemeContextInterface>({
  theme: "dark",
  toggleTheme: () => {},
});

// ─── Hook d'accès simplifié ───────────────────────────────────────────────────
// Avantage : les composants font juste `useTheme()` sans importer useContext + ThemeContext
export const useTheme = () => useContext(ThemeContext);

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }: { children: ReactNode }) => {

  // ✅ La fonction passée à useState n'est exécutée QU'UNE FOIS (initialisation)
  // C'est ce qu'on appelle une "lazy initial state" — parfait pour lire localStorage
  const [theme, setTheme] = useState<string>(
    () => localStorage.getItem(THEME_STORAGE_KEY) ?? "dark"
  );

  const toggleTheme = () => {
    // On calcule le nouveau thème depuis l'état React (pas depuis localStorage)
    const nextTheme = theme === "light" ? "dark" : "light";

    // 1. On persiste dans localStorage pour survivre au rechargement
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

    // 2. On met à jour le state React → déclenche le re-render
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
