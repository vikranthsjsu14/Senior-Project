import { Link } from 'react-router-dom';

export default function DisclaimerFooter() {
  return (
    <footer style={styles.footer}>
      <span>⚠️ HealthAI is for informational purposes only — not medical advice.</span>
      <Link to="/privacy" style={styles.link}>Privacy & Disclaimer</Link>
    </footer>
  );
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    padding: '12px 24px',
    borderTop: '1px solid var(--border)',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-muted)',
    fontSize: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  link: { color: 'var(--accent)', textDecoration: 'none' },
};
