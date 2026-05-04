import { useState, useEffect, FormEvent } from 'react';
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api/goals';
import { Goal } from '../types';

const GOAL_TYPES = [
  { value: 'steps_daily', label: 'Daily Steps', unit: 'steps', icon: '👟' },
  { value: 'weight_target', label: 'Target Weight', unit: 'kg', icon: '⚖️' },
  { value: 'calories_weekly', label: 'Weekly Calories Burned', unit: 'kcal', icon: '🔥' },
  { value: 'sleep_hours', label: 'Nightly Sleep', unit: 'hours', icon: '😴' },
  { value: 'workout_frequency', label: 'Weekly Workouts', unit: 'sessions', icon: '💪' },
];

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [completed, setCompleted] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'steps_daily', description: '', target_value: '', deadline: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGoals();
    fetchCompleted();
  }, []);

  const fetchGoals = async () => {
    try { setGoals(await getGoals(false)); } catch {}
  };

  const fetchCompleted = async () => {
    try {
      const all = await getGoals(true);
      setCompleted(all.filter((g) => g.is_completed));
    } catch {}
  };

  const goalMeta = (type: string) => GOAL_TYPES.find((g) => g.value === type);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    const meta = goalMeta(form.type);
    try {
      await createGoal({
        type: form.type,
        description: form.description || undefined,
        target_value: Number(form.target_value),
        unit: meta?.unit || 'units',
        deadline: form.deadline || undefined,
      });
      setMsg('Goal created!');
      setForm({ type: 'steps_daily', description: '', target_value: '', deadline: '' });
      setShowForm(false);
      fetchGoals();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create goal.');
    }
  };

  const handleProgress = async (goal: Goal, newValue: number) => {
    try {
      await updateGoal(goal.id, { current_value: newValue, is_completed: newValue >= goal.target_value });
      fetchGoals();
      fetchCompleted();
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try { await deleteGoal(id); fetchGoals(); fetchCompleted(); } catch {}
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Goals</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Set Goal'}
        </button>
      </div>

      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>New Goal</h3>
          <div style={styles.grid}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={styles.label}>Goal Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={styles.select}>
                {GOAL_TYPES.map((g) => <option key={g.value} value={g.value}>{g.icon} {g.label}</option>)}
              </select>
            </div>
            <Field label={`Target Value (${goalMeta(form.type)?.unit})`} type="number" value={form.target_value}
              onChange={(v) => setForm({ ...form, target_value: v })} placeholder={form.type === 'steps_daily' ? '10000' : '...'} required />
            <Field label="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="e.g. Walk 10k steps daily" />
            <Field label="Deadline (optional)" type="date" value={form.deadline} onChange={(v) => setForm({ ...form, deadline: v })} />
          </div>
          <button type="submit" style={styles.btn}>Create Goal</button>
        </form>
      )}

      <h2 style={styles.sectionTitle}>Active Goals</h2>
      {goals.length === 0 ? (
        <div style={styles.empty}>No active goals. Click "+ Set Goal" to get started!</div>
      ) : (
        <div style={styles.goalGrid}>
          {goals.map((g) => {
            const meta = goalMeta(g.type);
            const pct = g.progress_percent || 0;
            return (
              <div key={g.id} style={styles.goalCard}>
                <div style={styles.goalTop}>
                  <span style={styles.goalIcon}>{meta?.icon || '🎯'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={styles.goalName}>{g.description || meta?.label}</div>
                    {g.deadline && <div style={styles.goalDeadline}>Due: {g.deadline}</div>}
                  </div>
                  <button onClick={() => handleDelete(g.id)} style={styles.deleteBtn}>✕</button>
                </div>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width: `${Math.min(100, pct)}%` }} />
                </div>
                <div style={styles.goalStats}>
                  <span style={styles.goalPct}>{pct}%</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{g.current_value} / {g.target_value} {g.unit}</span>
                </div>
                <div style={styles.updateRow}>
                  <input
                    type="number"
                    defaultValue={g.current_value}
                    key={g.current_value}
                    onBlur={(e) => handleProgress(g, Number(e.target.value))}
                    style={styles.updateInput}
                    placeholder="Update progress"
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{g.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <>
          <h2 style={{ ...styles.sectionTitle, marginTop: '32px' }}>Completed Goals ✅</h2>
          <div style={styles.goalGrid}>
            {completed.map((g) => {
              const meta = goalMeta(g.type);
              return (
                <div key={g.id} style={{ ...styles.goalCard, opacity: 0.7, borderTop: '3px solid var(--accent)' }}>
                  <div style={styles.goalTop}>
                    <span style={styles.goalIcon}>{meta?.icon}</span>
                    <div>
                      <div style={styles.goalName}>{g.description || meta?.label}</div>
                      <div style={{ color: 'var(--accent)', fontSize: '12px' }}>Completed!</div>
                    </div>
                    <button onClick={() => handleDelete(g.id)} style={styles.deleteBtn}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, required }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ padding: '10px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none' }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: '1000px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { color: 'var(--text)', margin: 0 },
  addBtn: { padding: '10px 20px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' },
  sectionTitle: { color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' },
  form: { backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { color: 'var(--text)', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' },
  label: { color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 },
  select: { padding: '10px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' },
  btn: { padding: '11px 22px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' },
  success: { backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  goalGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' },
  goalCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '18px', borderTop: '3px solid #38bdf8' },
  goalTop: { display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' },
  goalIcon: { fontSize: '24px', flexShrink: 0 },
  goalName: { color: 'var(--text)', fontSize: '14px', fontWeight: 600 },
  goalDeadline: { color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' },
  progressBar: { height: '8px', backgroundColor: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' },
  progressFill: { height: '100%', backgroundColor: '#38bdf8', borderRadius: '4px', transition: 'width 0.3s ease' },
  goalStats: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  goalPct: { color: '#38bdf8', fontWeight: 700, fontSize: '16px' },
  updateRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  updateInput: { flex: 1, padding: '8px 12px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '13px', outline: 'none' },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '14px', padding: '2px 6px', marginLeft: 'auto' },
  empty: { textAlign: 'center', color: 'var(--text-dim)', padding: '40px', fontSize: '15px' },
};
