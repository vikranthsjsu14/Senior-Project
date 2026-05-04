import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { getDashboardSummary, syncWearable } from '../api/dashboard';
import { DashboardSummary } from '../types';
import MetricCard from '../components/dashboard/MetricCard';
import GoalRing from '../components/dashboard/GoalRing';
import StreakBadge from '../components/dashboard/StreakBadge';
import { useTheme } from '../context/ThemeContext';

export default function DashboardPage() {
  const { colors } = useTheme();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchSummary = async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const result = await syncWearable();
      setSyncMsg(result.message);
      await fetchSummary();
    } catch {
      setSyncMsg('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <PageLoader />;

  const today = summary?.today;
  const { avg_steps, avg_calories_burned, avg_sleep_hours } = summary?.weekly_averages || {};

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button onClick={handleSync} style={styles.syncBtn} disabled={syncing}>
          {syncing ? 'Syncing...' : '⌚ Sync Wearable'}
        </button>
      </div>

      {syncMsg && <div style={styles.syncMsg}>{syncMsg}</div>}

      {/* Streak + Goal Ring */}
      <section style={styles.topRow}>
        <div style={styles.ringCard}>
          <GoalRing
            current={today?.steps || 0}
            target={summary?.streak.target_steps || 10000}
            label="Today's Steps"
          />
        </div>
        <StreakBadge days={summary?.streak.days || 0} target={summary?.streak.target_steps || 0} />
      </section>

      {/* Today's Stats */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Today's Stats</h2>
        <div style={styles.cards}>
          <MetricCard
            label="Steps"
            value={today?.steps?.toLocaleString() || 0}
            icon="👟"
            color="var(--accent)"
            subtext={`7-day avg: ${avg_steps?.toLocaleString()}`}
          />
          <MetricCard
            label="Calories Burned"
            value={today?.calories_burned || 0}
            unit="kcal"
            icon="🔥"
            color="#fb923c"
            subtext={`7-day avg: ${avg_calories_burned} kcal`}
          />
          <MetricCard
            label="Water Intake"
            value={today ? Math.round(today.water_intake_ml / 100) / 10 : 0}
            unit="L"
            icon="💧"
            color="#38bdf8"
          />
          <MetricCard
            label="Active Minutes"
            value={today?.active_minutes || 0}
            unit="min"
            icon="⚡"
            color="#a78bfa"
          />
          <MetricCard
            label="Avg Sleep"
            value={avg_sleep_hours || 0}
            unit="hrs"
            icon="😴"
            color="#f472b6"
            subtext="7-day average"
          />
        </div>
      </section>

      <div style={styles.charts}>
        {/* Steps Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Steps — Last 7 Days</h3>
          {summary?.weekly_metrics.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={summary.weekly_metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="date" tick={{ fill: colors.textMuted, fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text }} />
                <Area type="monotone" dataKey="steps" stroke={colors.accent} fill="rgba(74,222,128,0.15)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Calories Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Calories — Last 7 Days</h3>
          {summary?.weekly_metrics.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={summary.weekly_metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="date" tick={{ fill: colors.textMuted, fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text }} />
                <Bar dataKey="calories_burned" name="Burned" fill="#fb923c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="calories_consumed" name="Consumed" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Sleep Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Sleep — Last 7 Days</h3>
          {summary?.sleep_logs.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={summary.sleep_logs}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis dataKey="date" tick={{ fill: colors.textMuted, fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fill: colors.textMuted, fontSize: 11 }} domain={[0, 12]} />
                <Tooltip contentStyle={{ backgroundColor: colors.bgCard, border: `1px solid ${colors.border}`, borderRadius: '8px', color: colors.text }} />
                <Bar dataKey="duration_hours" name="Hours" fill="#f472b6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      <div style={styles.bottomRow}>
        {/* Recent Activities */}
        <div style={styles.listCard}>
          <h3 style={styles.chartTitle}>Recent Activities</h3>
          {summary?.recent_activities.length ? (
            <div style={styles.activityList}>
              {summary.recent_activities.map((a) => (
                <div key={a.id} style={styles.activityItem}>
                  <span style={styles.activityIcon}>{typeIcon(a.type)}</span>
                  <div>
                    <div style={styles.activityName}>{a.name}</div>
                    <div style={styles.activityMeta}>
                      {a.duration_minutes} min {a.calories_burned ? `• ${a.calories_burned} kcal` : ''} • {a.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState text="No activities logged yet" />}
        </div>

        {/* Active Goals */}
        <div style={styles.listCard}>
          <h3 style={styles.chartTitle}>Active Goals</h3>
          {summary?.active_goals.length ? (
            <div style={styles.goalList}>
              {summary.active_goals.map((g) => (
                <div key={g.id} style={styles.goalItem}>
                  <div style={styles.goalHeader}>
                    <span style={styles.goalType}>{g.description || g.type}</span>
                    <span style={styles.goalPct}>{g.progress_percent}%</span>
                  </div>
                  <div style={styles.progressBar}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(100, g.progress_percent)}%`,
                        backgroundColor: g.progress_percent >= 100 ? 'var(--accent)' : '#38bdf8',
                      }}
                    />
                  </div>
                  <div style={styles.goalMeta}>
                    {g.current_value} / {g.target_value} {g.unit}
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyState text="No active goals. Set one!" />}
        </div>
      </div>
    </div>
  );
}

function typeIcon(type: string) {
  const icons: Record<string, string> = {
    cardio: '🏃', strength: '💪', flexibility: '🧘', sports: '⚽',
  };
  return icons[type] || '🏋️';
}

function EmptyChart() {
  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>
      No data yet — sync wearable or log manually
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p style={{ color: 'var(--text-dim)', fontSize: '14px', padding: '16px 0' }}>{text}</p>;
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div style={{ color: 'var(--accent)', fontSize: '18px' }}>Loading dashboard...</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: '1400px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  topRow: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  ringCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '12px', flex: '1 1 280px', minWidth: '280px' },
  title: { color: 'var(--text)', margin: 0, fontSize: '28px' },
  subtitle: { color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '14px' },
  syncBtn: {
    padding: '10px 18px',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--accent)',
    border: '1px solid var(--accent)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  syncMsg: {
    backgroundColor: 'rgba(74,222,128,0.1)',
    border: '1px solid var(--accent)',
    color: 'var(--accent)',
    padding: '10px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  section: { marginBottom: '24px' },
  sectionTitle: { color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' },
  cards: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  charts: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '16px' },
  chartCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px' },
  chartTitle: { color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  bottomRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' },
  listCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  activityItem: { display: 'flex', alignItems: 'center', gap: '12px' },
  activityIcon: { fontSize: '24px', width: '36px', textAlign: 'center' },
  activityName: { color: 'var(--text)', fontSize: '14px', fontWeight: 500 },
  activityMeta: { color: 'var(--text-muted)', fontSize: '12px' },
  goalList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  goalItem: {},
  goalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' },
  goalType: { color: 'var(--text)', fontSize: '13px' },
  goalPct: { color: '#38bdf8', fontSize: '13px', fontWeight: 600 },
  progressBar: { height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: '3px', transition: 'width 0.3s ease' },
  goalMeta: { color: 'var(--text-muted)', fontSize: '11px', marginTop: '3px' },
};
