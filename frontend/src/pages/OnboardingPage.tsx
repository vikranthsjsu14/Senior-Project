import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateMe } from '../api/users';
import { syncWearable } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';

const FITNESS_GOALS = [
  { value: 'weight_loss', label: '⬇️ Weight Loss' },
  { value: 'muscle_gain', label: '💪 Muscle Gain' },
  { value: 'endurance', label: '🏃 Endurance' },
  { value: 'general_wellness', label: '❤️ General Wellness' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'lightly_active', label: 'Lightly Active' },
  { value: 'moderately_active', label: 'Moderately Active' },
  { value: 'very_active', label: 'Very Active' },
];

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [basics, setBasics] = useState({
    age: '', weight_kg: '', height_cm: '', gender: '',
  });
  const [fitness, setFitness] = useState({
    fitness_goal: '', activity_level: '',
  });
  const [synced, setSynced] = useState(false);

  const saveProfile = async () => {
    setError(''); setLoading(true);
    try {
      const updated = await updateMe({
        age: basics.age ? Number(basics.age) : undefined,
        weight_kg: basics.weight_kg ? Number(basics.weight_kg) : undefined,
        height_cm: basics.height_cm ? Number(basics.height_cm) : undefined,
        gender: basics.gender || undefined,
        fitness_goal: fitness.fitness_goal || undefined,
        activity_level: fitness.activity_level || undefined,
      });
      setUser(updated);
      return true;
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Failed to save. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setError(''); setLoading(true);
    try {
      await syncWearable();
      setSynced(true);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'Sync failed. You can try again from the dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextFromStep1 = () => {
    if (!basics.age || !basics.weight_kg || !basics.height_cm) {
      setError('Please fill in age, weight, and height.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextFromStep2 = async () => {
    if (!fitness.fitness_goal || !fitness.activity_level) {
      setError('Please pick a fitness goal and activity level.');
      return;
    }
    const ok = await saveProfile();
    if (ok) setStep(3);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.progressBar}>
          <div style={{ ...styles.progressFill, width: `${(step / 3) * 100}%` }} />
        </div>
        <div style={styles.stepLabel}>Step {step} of 3</div>

        {step === 1 && (
          <>
            <h1 style={styles.title}>Welcome, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
            <p style={styles.subtitle}>Let's get your basics down so the AI can give you accurate advice.</p>

            <div style={styles.grid}>
              <Field label="Age" type="number" value={basics.age} onChange={(v) => setBasics({ ...basics, age: v })} placeholder="25" />
              <Field label="Weight (kg)" type="number" value={basics.weight_kg} onChange={(v) => setBasics({ ...basics, weight_kg: v })} placeholder="70" />
              <Field label="Height (cm)" type="number" value={basics.height_cm} onChange={(v) => setBasics({ ...basics, height_cm: v })} placeholder="175" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={styles.label}>Gender</label>
                <select value={basics.gender} onChange={(e) => setBasics({ ...basics, gender: e.target.value })} style={styles.select}>
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.actions}>
              <button onClick={handleNextFromStep1} style={styles.primaryBtn}>Continue →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={styles.title}>What's your goal?</h1>
            <p style={styles.subtitle}>We'll personalize your plan around this.</p>

            <div>
              <label style={styles.label}>Fitness Goal</label>
              <div style={styles.chips}>
                {FITNESS_GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setFitness({ ...fitness, fitness_goal: g.value })}
                    style={{ ...styles.chip, ...(fitness.fitness_goal === g.value ? styles.activeChip : {}) }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={styles.label}>Activity Level</label>
              <div style={styles.chips}>
                {ACTIVITY_LEVELS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setFitness({ ...fitness, activity_level: a.value })}
                    style={{ ...styles.chip, ...(fitness.activity_level === a.value ? styles.activeChip : {}) }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.actions}>
              <button onClick={() => setStep(1)} style={styles.secondaryBtn}>← Back</button>
              <button onClick={handleNextFromStep2} disabled={loading} style={styles.primaryBtn}>
                {loading ? 'Saving...' : 'Continue →'}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={styles.title}>Seed some demo data?</h1>
            <p style={styles.subtitle}>
              Tap sync to populate 7 days of realistic step, sleep, and heart-rate data — great for
              demoing the app before you've logged real data. You can skip this and log manually instead.
            </p>

            <div style={styles.syncBox}>
              {synced ? (
                <>
                  <div style={{ fontSize: '42px' }}>✅</div>
                  <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '16px' }}>7 days of data loaded!</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '42px' }}>⌚</div>
                  <button onClick={handleSync} disabled={loading} style={styles.primaryBtn}>
                    {loading ? 'Syncing...' : 'Sync Demo Data'}
                  </button>
                </>
              )}
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.actions}>
              <button onClick={() => setStep(2)} style={styles.secondaryBtn}>← Back</button>
              <button onClick={() => navigate('/dashboard')} style={styles.primaryBtn}>
                {synced ? 'Go to Dashboard →' : 'Skip & Continue →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={styles.label}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backgroundColor: 'var(--bg)' },
  card: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '560px', border: '1px solid var(--border)', boxShadow: '0 20px 60px var(--shadow)' },
  progressBar: { height: '4px', backgroundColor: 'var(--bg-input)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' },
  progressFill: { height: '100%', backgroundColor: 'var(--accent)', transition: 'width 0.3s ease' },
  stepLabel: { color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' },
  title: { color: 'var(--text)', fontSize: '26px', margin: '0 0 8px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  label: { color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 },
  input: { padding: '10px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none' },
  select: { padding: '10px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' },
  chip: { padding: '8px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' },
  activeChip: { backgroundColor: 'rgba(74,222,128,0.1)', borderColor: 'var(--accent)', color: 'var(--accent)' },
  syncBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '32px', backgroundColor: 'var(--bg-input)', borderRadius: '12px', margin: '16px 0' },
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '16px' },
  actions: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '24px' },
  primaryBtn: { padding: '12px 24px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
  secondaryBtn: { padding: '12px 20px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' },
};
