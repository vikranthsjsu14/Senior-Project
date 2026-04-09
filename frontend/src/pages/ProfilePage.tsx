import { useState, useEffect, FormEvent } from 'react';
import { updateMe } from '../api/users';
import { useAuth } from '../context/AuthContext';

const FITNESS_GOALS = [
  { value: 'weight_loss', label: '⬇️ Weight Loss' },
  { value: 'muscle_gain', label: '💪 Muscle Gain' },
  { value: 'endurance', label: '🏃 Endurance' },
  { value: 'general_wellness', label: '❤️ General Wellness' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (6-7 days/week)' },
];

const HEALTH_CONDITIONS_OPTIONS = ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Arthritis', 'None'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Lactose Intolerant', 'Keto', 'None'];

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    age: '',
    weight_kg: '',
    height_cm: '',
    gender: '',
    fitness_goal: '',
    activity_level: '',
    health_conditions: [] as string[],
    dietary_restrictions: [] as string[],
  });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        age: user.age?.toString() || '',
        weight_kg: user.weight_kg?.toString() || '',
        height_cm: user.height_cm?.toString() || '',
        gender: user.gender || '',
        fitness_goal: user.fitness_goal || '',
        activity_level: user.activity_level || '',
        health_conditions: user.health_conditions ? JSON.parse(user.health_conditions) : [],
        dietary_restrictions: user.dietary_restrictions ? JSON.parse(user.dietary_restrictions) : [],
      });
    }
  }, [user]);

  const toggleItem = (list: string[], item: string, field: 'health_conditions' | 'dietary_restrictions') => {
    const updated = list.includes(item)
      ? list.filter((i) => i !== item)
      : [...list.filter((i) => i !== 'None'), item === 'None' ? 'None' : item];
    if (item === 'None') {
      setForm({ ...form, [field]: ['None'] });
    } else {
      setForm({ ...form, [field]: updated.filter((i) => i !== 'None') });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    setLoading(true);
    try {
      const updated = await updateMe({
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
        height_cm: form.height_cm ? Number(form.height_cm) : undefined,
        gender: form.gender || undefined,
        fitness_goal: form.fitness_goal || undefined,
        activity_level: form.activity_level || undefined,
        health_conditions: form.health_conditions.length > 0 ? JSON.stringify(form.health_conditions) : undefined,
        dietary_restrictions: form.dietary_restrictions.length > 0 ? JSON.stringify(form.dietary_restrictions) : undefined,
      });
      setUser(updated);
      setMsg('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // BMI calculation
  const bmi = form.weight_kg && form.height_cm
    ? (Number(form.weight_kg) / Math.pow(Number(form.height_cm) / 100, 2)).toFixed(1)
    : null;
  const bmiCategory = bmi
    ? Number(bmi) < 18.5 ? { label: 'Underweight', color: '#38bdf8' }
    : Number(bmi) < 25 ? { label: 'Normal', color: '#4ade80' }
    : Number(bmi) < 30 ? { label: 'Overweight', color: '#fb923c' }
    : { label: 'Obese', color: '#ef4444' }
    : null;

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>My Profile</h1>
      <p style={styles.subtitle}>Complete your profile to get the most accurate AI recommendations.</p>

      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.formWrapper}>
        {/* Basic Info */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Basic Information</h2>
          <div style={styles.grid}>
            <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} placeholder="25" />
            <Field label="Weight (kg)" type="number" value={form.weight_kg} onChange={(v) => setForm({ ...form, weight_kg: v })} placeholder="70" />
            <Field label="Height (cm)" type="number" value={form.height_cm} onChange={(v) => setForm({ ...form, height_cm: v })} placeholder="175" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={styles.label}>Gender</label>
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={styles.select}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            {bmi && bmiCategory && (
              <div style={styles.bmiCard}>
                <div style={styles.bmiLabel}>BMI</div>
                <div style={{ color: bmiCategory.color, fontSize: '28px', fontWeight: 700 }}>{bmi}</div>
                <div style={{ color: bmiCategory.color, fontSize: '13px' }}>{bmiCategory.label}</div>
              </div>
            )}
          </div>
        </section>

        {/* Fitness */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fitness Profile</h2>
          <div style={styles.choiceGrid}>
            <div>
              <label style={styles.label}>Fitness Goal</label>
              <div style={styles.chips}>
                {FITNESS_GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setForm({ ...form, fitness_goal: g.value })}
                    style={{ ...styles.chip, ...(form.fitness_goal === g.value ? styles.activeChip : {}) }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={styles.label}>Activity Level</label>
              <div style={styles.chips}>
                {ACTIVITY_LEVELS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setForm({ ...form, activity_level: a.value })}
                    style={{ ...styles.chip, ...(form.activity_level === a.value ? styles.activeChip : {}) }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Health */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Health Information</h2>
          <div style={styles.choiceGrid}>
            <div>
              <label style={styles.label}>Health Conditions</label>
              <div style={styles.chips}>
                {HEALTH_CONDITIONS_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleItem(form.health_conditions, c, 'health_conditions')}
                    style={{ ...styles.chip, ...(form.health_conditions.includes(c) ? styles.activeChip : {}) }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={styles.label}>Dietary Restrictions</label>
              <div style={styles.chips}>
                {DIETARY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleItem(form.dietary_restrictions, d, 'dietary_restrictions')}
                    style={{ ...styles.chip, ...(form.dietary_restrictions.includes(d) ? styles.activeChip : {}) }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <button type="submit" style={styles.saveBtn} disabled={loading}>
          {loading ? 'Saving...' : '💾 Save Profile'}
        </button>
      </form>
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
  title: { color: '#f1f5f9', marginBottom: '4px' },
  subtitle: { color: '#64748b', fontSize: '14px', marginBottom: '24px' },
  success: { backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid #4ade80', color: '#4ade80', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  formWrapper: { display: 'flex', flexDirection: 'column', gap: '24px' },
  section: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' },
  sectionTitle: { color: '#f1f5f9', margin: '0 0 16px', fontSize: '17px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  label: { color: '#94a3b8', fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' },
  select: { padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', width: '100%' },
  bmiCard: { backgroundColor: '#0f172a', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  bmiLabel: { color: '#64748b', fontSize: '12px', marginBottom: '4px' },
  choiceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' },
  chip: { padding: '8px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '20px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', transition: 'all 0.2s' },
  activeChip: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: '#4ade80', color: '#4ade80' },
  saveBtn: { padding: '14px 32px', backgroundColor: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', alignSelf: 'flex-start' },
};
