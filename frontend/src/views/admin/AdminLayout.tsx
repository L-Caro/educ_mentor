import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Header from "src/components/layout/Header/Header.tsx";
import { useAuth } from 'src/hook/useAuth';

const NAV_ITEMS = [
  { to: "/admin", label: "Tableau de bord", icon: "🏠", end: true },
  { to: "/admin/modules", label: "Modules", icon: "🧩", end: false },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="AdminLayout">
        <aside className="AdminLayout__sidebar">
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
                >
                  <span>{navItem.icon}</span>
                  {navItem.label}
                </NavLink>
              </li>
            ))}
          </ul>

          <ul className="AdminLayout__navFooter">
            <li>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `AdminLayout__navLink${isActive ? ' AdminLayout__navLink--active' : ''}`
                }
              >
                <span>⚙️</span> Paramètres
              </NavLink>
            </li>
            <li>
              <button
                className="AdminLayout__navButton"
                onClick={() => { logout(); navigate('/'); }}
              >
                <span>🚪</span> Retour accueil
              </button>
            </li>
          </ul>
        </aside>

        <main className="AdminLayout__main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
