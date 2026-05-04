import { useState, useEffect, FormEvent } from 'react';
import { getActivities, logActivity, deleteActivity } from '../api/activities';
import { Activity } from '../types';

const ACTIVITY_TYPES = ['cardio', 'strength', 'flexibility', 'sports'];
const TYPE_ICONS: Record<string, string> = { cardio: '🏃', strength: '💪', flexibility: '🧘', sports: '⚽' };

export default function ActivitiesPage() {
  const today = new Date().toISOString().split('T')[0];
  const [activities, setActivities] = useState<Activity[]>([]);
  const [form, setForm] = useState({ name: '', type: 'cardio', duration_minutes: '', calories_burned: '', distance_km: '', date: today, notes: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchActivities(); }, []);

  const fetchActivities = async () => {
    try { setActivities(await getActivities(30)); } catch {}
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await logActivity({
        name: form.name,
        type: form.type,
        duration_minutes: Number(form.duration_minutes),
        calories_burned: form.calories_burned ? Number(form.calories_burned) : undefined,
        distance_km: form.distance_km ? Number(form.distance_km) : undefined,
        date: form.date,
        notes: form.notes || undefined,
      });
      setMsg('Activity logged!');
      setForm({ name: '', type: 'cardio', duration_minutes: '', calories_burned: '', distance_km: '', date: today, notes: '' });
      setShowForm(false);
      fetchActivities();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log activity.');
    }
  };

  const handleDelete = async (id: number) => {
    try { await deleteActivity(id); fetchActivities(); } catch {}
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Activities</h1>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? 'Cancel' : '+ Log Activity'}
        </button>
      </div>

      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>Log a Workout</h3>
          <div style={styles.grid}>
            <Field label="Activity Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Morning Run" required />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={styles.label}>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={styles.select}>
                {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <Field label="Duration (minutes)" type="number" value={form.duration_minutes} onChange={(v) => setForm({ ...form, duration_minutes: v })} placeholder="30" required />
            <Field label="Calories Burned" type="number" value={form.calories_burned} onChange={(v) => setForm({ ...form, calories_burned: v })} placeholder="Optional" />
            <Field label="Distance (km)" type="number" value={form.distance_km} onChange={(v) => setForm({ ...form, distance_km: v })} placeholder="Optional" />
            <Field label="Date" type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} required />
          </div>
          <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Optional notes..." />
          <button type="submit" style={styles.btn}>Save Activity</button>
        </form>
      )}

      <div style={styles.list}>
        {activities.length === 0 ? (
          <div style={styles.empty}>No activities logged yet. Click "+ Log Activity" to start!</div>
        ) : (
          activities.map((a) => (
            <div key={a.id} style={styles.card}>
              <div style={styles.cardIcon}>{TYPE_ICONS[a.type] || '🏋️'}</div>
              <div style={styles.cardBody}>
                <div style={styles.cardName}>{a.name}</div>
                <div style={styles.cardMeta}>
                  <span style={styles.badge}>{a.type}</span>
                  <span>{a.duration_minutes} min</span>
                  {a.calories_burned && <span>🔥 {a.calories_burned} kcal</span>}
                  {a.distance_km && <span>📍 {a.distance_km} km</span>}
                  <span style={{ color: 'var(--text-muted)' }}>{a.date}</span>
                </div>
                {a.notes && <div style={styles.notes}>{a.notes}</div>}
              </div>
              <button onClick={() => handleDelete(a.id)} style={styles.deleteBtn} title="Delete">✕</button>
            </div>
          ))
        )}
      </div>
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
  page: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { color: 'var(--text)', margin: 0 },
  addBtn: { padding: '10px 20px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' },
  form: { backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { color: 'var(--text)', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' },
  label: { color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 },
  select: { padding: '10px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' },
  btn: { padding: '11px 22px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' },
  success: { backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' },
  cardIcon: { fontSize: '28px', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardName: { color: 'var(--text)', fontWeight: 600, fontSize: '15px', marginBottom: '4px' },
  cardMeta: { display: 'flex', gap: '12px', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '13px', alignItems: 'center' },
  badge: { backgroundColor: 'var(--bg-input)', padding: '2px 8px', borderRadius: '12px', color: '#38bdf8', fontSize: '12px' },
  notes: { color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '16px', padding: '4px 8px', flexShrink: 0 },
  empty: { textAlign: 'center', color: 'var(--text-dim)', padding: '40px', fontSize: '15px' },
};
