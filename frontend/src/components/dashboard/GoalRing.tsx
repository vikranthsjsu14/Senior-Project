import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';

interface GoalRingProps {
  current: number;
  target: number;
  label: string;
  unit?: string;
}

export default function GoalRing({ current, target, label, unit = '' }: GoalRingProps) {
  const { colors } = useTheme();
  const safeTarget = target > 0 ? target : 1;
  const pct = Math.min(100, Math.round((current / safeTarget) * 100));
  const remaining = Math.max(0, 100 - pct);
  const data = [
    { name: 'done', value: pct },
    { name: 'remaining', value: remaining },
  ];
  const ringColor = pct >= 100 ? colors.accent : '#38bdf8';

  return (
    <div style={{ position: 'relative', width: '100%', height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            <Cell fill={ringColor} />
            <Cell fill={colors.border} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ fontSize: '28px', fontWeight: 700, color: colors.text }}>{pct}%</div>
        <div style={{ fontSize: '11px', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
          {current.toLocaleString()}{unit ? ` ${unit}` : ''} / {target.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
