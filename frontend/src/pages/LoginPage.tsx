import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <img src="/healthai-logo.png" alt="HealthAI" style={styles.logoImg} />
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              required
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg)',
  },
  card: {
    backgroundColor: 'var(--bg-card)',
    padding: '40px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px var(--shadow)',
    border: '1px solid var(--border)',
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  logoImg: { width: '100%', maxWidth: '280px', height: 'auto', display: 'block', margin: '0 auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  error: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    border: '1px solid #ef4444',
    color: '#fca5a5',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '14px',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 },
  input: {
    padding: '10px 14px',
    backgroundColor: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '15px',
    outline: 'none',
  },
  btn: {
    padding: '12px',
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-dark)',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  footer: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginTop: '20px' },
  link: { color: 'var(--accent)', textDecoration: 'none' },
};
