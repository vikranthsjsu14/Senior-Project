interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: string;
  subtext?: string;
}

export default function MetricCard({ label, value, unit, icon, color, subtext }: MetricCardProps) {
  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${color}` }}>
      <div style={styles.top}>
        <span style={styles.icon}>{icon}</span>
        <span style={{ ...styles.label, color: '#94a3b8' }}>{label}</span>
      </div>
      <div style={styles.valueRow}>
        <span style={{ ...styles.value, color }}>{value}</span>
        {unit && <span style={styles.unit}>{unit}</span>}
      </div>
      {subtext && <div style={styles.subtext}>{subtext}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    flex: 1,
    minWidth: '150px',
  },
  top: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  icon: { fontSize: '22px' },
  label: { fontSize: '13px', fontWeight: 500 },
  valueRow: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  value: { fontSize: '32px', fontWeight: 700 },
  unit: { fontSize: '14px', color: '#64748b' },
  subtext: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
};
