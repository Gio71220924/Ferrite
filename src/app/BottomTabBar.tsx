import { NavLink } from 'react-router-dom';
import { Library, Search, Plug } from 'lucide-react';
import styles from './BottomTabBar.module.css';

const TABS = [
  { to: '/', label: 'Library', Icon: Library },
  { to: '/search', label: 'Search', Icon: Search },
  { to: '/sources', label: 'Sources', Icon: Plug },
];

export function BottomTabBar() {
  return (
    <nav className={styles.bar}>
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.tabActive : ''}`}
        >
          <Icon size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
