import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from '../App';

export default function Navigation() {
  const { backendStatus } = useContext(AppContext);

  const tabs = [
    { to: '/algorithms', label: 'Algorithms' },
    { to: '/languages', label: 'Languages' },
    { to: '/comparisons', label: 'Comparisons' },
  ];

  if (import.meta.env.DEV) {
    tabs.push({ to: '/history', label: 'History' });
  }

  return (
    <nav className="nav-bar">
      <div className="nav-brand">
        <img src="/logo.png" alt="UB Sort Labs" className="nav-brand-icon" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        <h1>UB SORT LABS</h1>
      </div>

      <div className="nav-tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <div className="nav-spacer" />

      <div className="nav-status">
        <span className={`status-dot ${backendStatus}`} />
        {backendStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
      </div>
    </nav>
  );
}
