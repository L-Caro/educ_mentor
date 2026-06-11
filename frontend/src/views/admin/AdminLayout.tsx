import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Header from "src/components/layout/Header/Header.tsx";
import { useAuth } from 'src/hooks/useAuth';
import { useModuleMeta } from 'src/hooks';
import { MODULES } from 'src/modules.manifest';

const NAV_ITEMS = [
  { to: "/admin", label: "Tableau de bord", icon: "🏠", end: true },
  { to: "/admin/modules", label: "Modules", icon: "🧩", end: false },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const getModuleMeta = useModuleMeta();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <>
      <Header />
      <div className="AdminLayout">
        {isMobileMenuOpen && (
          <div className="AdminLayout__overlay" onClick={closeMobileMenu} />
        )}

        <aside className={`AdminLayout__sidebar${isMobileMenuOpen ? ' AdminLayout__sidebar--open' : ''}`}>
          <div className="AdminLayout__brand">
            <p className="AdminLayout__brandTitle">ÉducMentor</p>
            <p className="AdminLayout__brandSub">Administration</p>
          </div>

          <ul className="AdminLayout__nav">
            {NAV_ITEMS.map((navItem) => (
              <li key={navItem.to}>
                <NavLink
                  to={navItem.to}
                  end={navItem.end}
                  className={({ isActive }) =>
                    `AdminLayout__navLink${isActive ? ' AdminLayout__navLink--active' : ''}`
                  }
                  onClick={closeMobileMenu}
                >
                  <span>{navItem.icon}</span>
                  {navItem.label}
                </NavLink>
              </li>
            ))}

            {/* Un lien par module, piloté par le manifest — plus de module « oublié ». */}
            {MODULES.map((module) => {
              const meta = getModuleMeta(module.id);
              return (
                <li key={module.id}>
                  <NavLink
                    to={`/admin/${module.id}`}
                    className={({ isActive }) =>
                      `AdminLayout__navLink${isActive ? ' AdminLayout__navLink--active' : ''}`
                    }
                    onClick={closeMobileMenu}
                  >
                    <span>{meta?.icon}</span>
                    {meta?.name ?? module.id}
                  </NavLink>
                </li>
              );
            })}
          </ul>

          <ul className="AdminLayout__navFooter">
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `AdminLayout__navLink${isActive ? ' AdminLayout__navLink--active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                <span>⚙️</span> Paramètres
              </NavLink>
            </li>
            <li>
              <button
                className="AdminLayout__navButton"
                onClick={() => { closeMobileMenu(); logout(); navigate('/'); }}
              >
                <span>🚪</span> Retour accueil
              </button>
            </li>
          </ul>
        </aside>

        <main className="AdminLayout__main">
          <button
            className="AdminLayout__hamburger"
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
