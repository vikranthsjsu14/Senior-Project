import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/metrics', label: 'Metrics' },
  { path: '/activities', label: 'Activities' },
  { path: '/nutrition', label: 'Nutrition' },
  { path: '/goals', label: 'Goals' },
  { path: '/recommendations', label: 'AI Coach' },
  { path: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
        <span style={styles.logo}>💪</span>
        <span style={styles.brandName}>HealthAI</span>
      </div>
      <div style={styles.links}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.link,
              ...(location.pathname === item.path ? styles.activeLink : {}),
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div style={styles.userSection}>
        <span style={styles.userName}>{user?.name}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '60px',
    backgroundColor: '#1a1a2e',
    color: '#fff',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  logo: { fontSize: '24px' },
  brandName: { fontSize: '20px', fontWeight: 700, color: '#4ade80' },
  links: { display: 'flex', gap: '4px' },
  link: {
    color: '#cbd5e1',
    textDecoration: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  activeLink: {
    color: '#4ade80',
    backgroundColor: 'rgba(74,222,128,0.1)',
  },
  userSection: { display: 'flex', alignItems: 'center', gap: '12px' },
  userName: { fontSize: '14px', color: '#94a3b8' },
  logoutBtn: {
    padding: '6px 14px',
    backgroundColor: 'transparent',
    border: '1px solid #475569',
    color: '#94a3b8',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
};
