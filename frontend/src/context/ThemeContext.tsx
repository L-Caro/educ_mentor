/*
 Il suffit de faire :
 const { theme, toggleTheme } = useTheme();
 dans le composant qui aura besoin du context
 */

import { createContext, ReactNode, useContext, useState } from "react";


//? Typage
interface ThemeContextInterface {
  theme: string;
  toggleTheme: () => void;
}


//? Hook d'import
export const useTheme = () => {
  // Permet d'importer cette fonction en déstructurant ce qu'on a besoin plutôt que de faire import useContext(context)
  // à chaque fois
  return useContext( ThemeContext );
};

//? Context
export const ThemeContext = createContext<ThemeContextInterface>( {
  theme: "light",
  toggleTheme: () => {}
} );

//? Provider
export const ThemeProvider = ( { children }: { children: ReactNode } ) => {
  const [ theme, setTheme ] = useState( "dark" );

  const toggleTheme = () => {
    setTheme( theme === "light" ? "dark" : "light" );
  };

  return (
    <ThemeContext.Provider value={ { theme, toggleTheme } }>
      { children }
    </ThemeContext.Provider>
  );
};
