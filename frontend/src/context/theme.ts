import { createContext, useContext } from 'react';

/** Contexte et hook séparés du provider : un fichier `.tsx` qui exporte autre chose que des
 * composants casse le Fast Refresh de Vite (le module entier est rechargé, l'état est perdu). */

export type Theme = 'light' | 'dark' | 'system';

export interface ThemeContextInterface {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextInterface>({
  theme: 'system',
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);
