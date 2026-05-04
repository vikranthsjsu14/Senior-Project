interface StreakBadgeProps {
  days: number;
  target: number;
}

export default function StreakBadge({ days, target }: StreakBadgeProps) {
  if (target <= 0) {
    return (
      <div style={styles.card}>
        <div style={styles.icon}>🎯</div>
        <div>
          <div style={styles.value}>Set a daily steps goal</div>
          <div style={styles.sub}>to start a streak</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${days > 0 ? '#fb923c' : 'var(--border)'}` }}>
      <div style={styles.icon}>{days > 0 ? '🔥' : '💤'}</div>
      <div>
        <div style={styles.value}>
          {days} day{days === 1 ? '' : 's'}
        </div>
        <div style={styles.sub}>
          {days > 0
            ? `Hit ${target.toLocaleString()} steps in a row`
            : `Walk ${target.toLocaleString()} steps today to start`}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'var(--bg-card)',
    borderRadius: '12px',
    padding: '20px',
    flex: 1,
    minWidth: '220px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  icon: { fontSize: '36px' },
  value: { color: 'var(--text)', fontSize: '22px', fontWeight: 700 },
  sub: { color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' },
};
