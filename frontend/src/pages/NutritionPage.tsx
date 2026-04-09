import { useState, useEffect, FormEvent } from 'react';
import { getNutrition, logNutrition, deleteNutrition } from '../api/nutrition';
import { NutritionLog } from '../types';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_ICONS: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' };

export default function NutritionPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: today, meal_type: 'breakfast', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { fetchLogs(); }, [date]);

  const fetchLogs = async () => {
    try { setLogs(await getNutrition(date)); } catch {}
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await logNutrition({
        date: form.date,
        meal_type: form.meal_type,
        food_name: form.food_name,
        calories: Number(form.calories),
        protein_g: form.protein_g ? Number(form.protein_g) : undefined,
        carbs_g: form.carbs_g ? Number(form.carbs_g) : undefined,
        fat_g: form.fat_g ? Number(form.fat_g) : undefined,
      });
      setMsg('Food logged!');
      setForm({ date: form.date, meal_type: 'breakfast', food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '' });
      setShowForm(false);
      fetchLogs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log food.');
    }
  };

  const handleDelete = async (id: number) => {
    try { await deleteNutrition(id); fetchLogs(); } catch {}
  };

  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0);
  const totalProtein = logs.reduce((sum, l) => sum + (l.protein_g || 0), 0);
  const totalCarbs = logs.reduce((sum, l) => sum + (l.carbs_g || 0), 0);
  const totalFat = logs.reduce((sum, l) => sum + (l.fat_g || 0), 0);

  const grouped = MEAL_TYPES.reduce((acc, m) => {
    acc[m] = logs.filter((l) => l.meal_type === m);
    return acc;
  }, {} as Record<string, NutritionLog[]>);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Nutrition</h1>
        <div style={styles.headerRight}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.dateInput} />
          <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
            {showForm ? 'Cancel' : '+ Log Food'}
          </button>
        </div>
      </div>

      {/* Totals */}
      {logs.length > 0 && (
        <div style={styles.totals}>
          <Stat label="Calories" value={Math.round(totalCalories)} unit="kcal" color="#fb923c" />
          <Stat label="Protein" value={Math.round(totalProtein)} unit="g" color="#4ade80" />
          <Stat label="Carbs" value={Math.round(totalCarbs)} unit="g" color="#38bdf8" />
          <Stat label="Fat" value={Math.round(totalFat)} unit="g" color="#f472b6" />
        </div>
      )}

      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h3 style={styles.formTitle}>Log Food</h3>
          <div style={styles.grid}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={styles.label}>Meal</label>
              <select value={form.meal_type} onChange={(e) => setForm({ ...form, meal_type: e.target.value })} style={styles.select}>
                {MEAL_TYPES.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
              </select>
            </div>
            <Field label="Food Name" value={form.food_name} onChange={(v) => setForm({ ...form, food_name: v })} placeholder="Grilled Chicken" required />
            <Field label="Calories" type="number" value={form.calories} onChange={(v) => setForm({ ...form, calories: v })} placeholder="350" required />
            <Field label="Protein (g)" type="number" value={form.protein_g} onChange={(v) => setForm({ ...form, protein_g: v })} placeholder="Optional" />
            <Field label="Carbs (g)" type="number" value={form.carbs_g} onChange={(v) => setForm({ ...form, carbs_g: v })} placeholder="Optional" />
            <Field label="Fat (g)" type="number" value={form.fat_g} onChange={(v) => setForm({ ...form, fat_g: v })} placeholder="Optional" />
          </div>
          <button type="submit" style={styles.btn}>Save Food</button>
        </form>
      )}

      {/* Grouped by meal */}
      <div style={styles.mealGroups}>
        {MEAL_TYPES.map((meal) => (
          grouped[meal].length > 0 && (
            <div key={meal} style={styles.mealGroup}>
              <h3 style={styles.mealTitle}>{MEAL_ICONS[meal]} {meal.charAt(0).toUpperCase() + meal.slice(1)}</h3>
              {grouped[meal].map((log) => (
                <div key={log.id} style={styles.logItem}>
                  <div style={styles.logBody}>
                    <span style={styles.foodName}>{log.food_name}</span>
                    <div style={styles.macros}>
                      <span style={{ color: '#fb923c' }}>{log.calories} kcal</span>
                      {log.protein_g && <span>P: {log.protein_g}g</span>}
                      {log.carbs_g && <span>C: {log.carbs_g}g</span>}
                      {log.fat_g && <span>F: {log.fat_g}g</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(log.id)} style={styles.deleteBtn}>✕</button>
                </div>
              ))}
            </div>
          )
        ))}
        {logs.length === 0 && (
          <div style={styles.empty}>No food logged for this date. Click "+ Log Food" to start!</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={{ backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 20px', textAlign: 'center', flex: 1 }}>
      <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>{label}</div>
      <div style={{ color, fontSize: '22px', fontWeight: 700 }}>{value}<span style={{ fontSize: '13px', color: '#64748b' }}> {unit}</span></div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, required }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        style={{ padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', outline: 'none' }} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  headerRight: { display: 'flex', gap: '10px', alignItems: 'center' },
  title: { color: '#f1f5f9', margin: 0 },
  dateInput: { padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px' },
  addBtn: { padding: '10px 20px', backgroundColor: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' },
  totals: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
  form: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { color: '#f1f5f9', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' },
  label: { color: '#94a3b8', fontSize: '13px', fontWeight: 500 },
  select: { padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px' },
  btn: { padding: '11px 22px', backgroundColor: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' },
  success: { backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid #4ade80', color: '#4ade80', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  mealGroups: { display: 'flex', flexDirection: 'column', gap: '16px' },
  mealGroup: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px 20px' },
  mealTitle: { color: '#f1f5f9', margin: '0 0 12px', fontSize: '15px' },
  logItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0f172a' },
  logBody: { flex: 1 },
  foodName: { color: '#e2e8f0', fontSize: '14px' },
  macros: { display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#64748b', fontSize: '12px', marginTop: '2px' },
  deleteBtn: { backgroundColor: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '14px', padding: '4px 8px' },
  empty: { textAlign: 'center', color: '#475569', padding: '40px', fontSize: '15px' },
};
