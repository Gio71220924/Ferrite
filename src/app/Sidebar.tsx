import { NavLink } from 'react-router-dom';
import { Library, Search, ListMusic, Settings } from 'lucide-react';
import { FerriteMark } from '../components/FerriteMark';
import styles from './Sidebar.module.css';

const LINKS = [
  { to: '/', label: 'Library', Icon: Library },
  { to: '/search', label: 'Search', Icon: Search },
  { to: '/queue', label: 'Queue', Icon: ListMusic },
  { to: '/settings', label: 'Settings', Icon: Settings },
];

export function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <FerriteMark size={24} color="var(--l1)" />
        <span className={styles.brandText}>Ferrite</span>
      </div>
      <nav className={styles.nav}>
        {LINKS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.linkActive : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
