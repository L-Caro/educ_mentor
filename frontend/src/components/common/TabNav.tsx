import { NavLink } from 'react-router-dom';

export interface Tab {
  to: string;
  label: string;
  end?: boolean;
}

interface TabNavProps {
  tabs: Tab[]
}

export default function TabNav({ tabs }: TabNavProps) {
  return (
    <nav className="TabNav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `TabNav__tab${isActive ? ' TabNav__tab--active' : ''}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
