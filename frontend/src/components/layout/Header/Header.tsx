import { useEffect } from 'react';
import { useMatches, useNavigate } from 'react-router-dom';
import { useTheme } from 'src/context/ThemeContext';
import { useModuleMetaResolver } from 'src/hooks';
import dark from 'src/assets/images/dark-theme.svg';
import light from 'src/assets/images/light-theme.svg';
import { MAIN_TITLE } from "src/routes/router.tsx";
import GearButton from 'src/components/auth/GearButton';

interface RouteHandle {
  title?: string;
  moduleId?: string;
}

function Header() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const matches = useMatches();
  const getModuleMeta = useModuleMetaResolver();

  const lastMatch = matches[matches.length - 1];
  const handle = lastMatch?.handle as RouteHandle | undefined;
  // Routes module → titre = nom backend (source unique) ; routes transverses → titre statique.
  const title = handle?.moduleId
    ? (getModuleMeta(handle.moduleId)?.name ?? '')
    : (handle?.title ?? MAIN_TITLE);
  const isHome = !handle?.moduleId && title === MAIN_TITLE && lastMatch?.pathname === '/';

  useEffect(() => {
    document.documentElement.setAttribute('class', theme);
  }, [theme]);

  return (
    <header className="Header">
      <div className="Header__left">
        {!isHome && (
          <>
            <button
              className="Header__back"
              onClick={() => navigate(-1)}
              aria-label="Retour"
            >
              ←
            </button>
            <button
              className="Header__home"
              onClick={() => navigate('/')}
              aria-label="Accueil"
            >
              🏠
            </button>
          </>
        )}
      </div>

      <h1 className="Header__title">{title}</h1>

      <div className="Header__right">
        <GearButton />
        <button
          className="Header__theme-toggle"
          onClick={toggleTheme}
          aria-label="Changer le thème"
        >
          <img src={theme === 'dark' ? dark as string : light as string} alt={theme} />
        </button>
      </div>
    </header>
  );
}

export default Header;
