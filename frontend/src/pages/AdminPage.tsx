import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Header from "src/components/layout/Header/Header.tsx";
import { useAuth } from 'src/hooks';

const NAV_ITEMS = [
  { to: "/admin", label: "Tableau de bord", icon: "🏠", end: true },
  { to: "/admin/modules", label: "Modules", icon: "🧩", end: false },
];

export default function AdminPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <>
      <Header />
      <div className="AdminPage">
        {isMobileMenuOpen && (
          <div className="AdminPage__overlay" onClick={closeMobileMenu} />
        )}

        <aside className={`AdminPage__sidebar${isMobileMenuOpen ? ' AdminPage__sidebar--open' : ''}`}>
          <div className="AdminPage__brand">
            <p className="AdminPage__brandTitle">ÉducMentor</p>
            <p className="AdminPage__brandSub">Administration</p>
          </div>

          <ul className="AdminPage__nav">
            {NAV_ITEMS.map((navItem) => (
              <li key={navItem.to}>
                <NavLink
                  to={navItem.to}
                  end={navItem.end}
                  className={({ isActive }) =>
                    `AdminPage__navLink${isActive ? ' AdminPage__navLink--active' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <span>{navItem.icon}</span>
                  {navItem.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <ul className="AdminPage__navFooter">
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `AdminPage__navLink${isActive ? ' AdminPage__navLink--active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                <span>⚙️</span> Paramètres
              </NavLink>
            </li>
            <li>
              <button
                className="AdminPage__navButton"
                onClick={() => { closeMobileMenu(); logout(); navigate('/'); }}
              >
                <span>🚪</span> Retour accueil
              </button>
            </li>
          </ul>
        </aside>

        <main className="AdminPage__main">
          <button
            className="AdminPage__hamburger"
            onClick={() => setIsMobileMenuOpen((previousIsOpen) => !previousIsOpen)}
            aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
          <Outlet />
        </main>
      </div>
    </>
  );
}
