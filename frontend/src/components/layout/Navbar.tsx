import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/metrics', label: 'Metrics' },
  { path: '/activities', label: 'Activities' },
  { path: '/nutrition', label: 'Nutrition' },
  { path: '/goals', label: 'Goals' },
  { path: '/food-scan', label: 'Food Scan' },
  { path: '/form-coach', label: 'Form Coach' },
  { path: '/recommendations', label: 'AI Coach' },
  { path: '/profile', label: 'Profile' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '60px',
      backgroundColor: 'var(--nav-bg)',
      color: 'var(--text)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      boxShadow: '0 2px 8px var(--shadow)',
      borderBottom: '1px solid var(--border)',
      transition: 'background-color 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '24px' }}>💪</span>
        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent)' }}>HealthAI</span>
      </div>

      <div style={{ display: 'flex', gap: '4px' }}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              color: location.pathname === item.path ? 'var(--accent)' : 'var(--text-secondary)',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'all 0.2s',
              backgroundColor: location.pathname === item.path ? 'rgba(74,222,128,0.1)' : 'transparent',
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            width: '40px',
            height: '24px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: theme === 'dark' ? 'var(--bg-input)' : '#e2e8f0',
            cursor: 'pointer',
            position: 'relative',
            padding: 0,
            transition: 'background-color 0.3s ease',
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span
            style={{
              position: 'absolute',
              top: '2px',
              left: theme === 'dark' ? '2px' : '18px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              transition: 'left 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
            }}
          >
            {theme === 'dark' ? '🌙' : '☀️'}
          </span>
        </button>

        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user?.name}</span>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
