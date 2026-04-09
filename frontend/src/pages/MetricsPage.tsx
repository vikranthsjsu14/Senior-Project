import { useState, useEffect, FormEvent } from 'react';
import { logDailyMetrics, logSleep, getDailyMetrics, getSleepLogs } from '../api/metrics';
import client from '../api/client';
import { DailyMetrics, SleepLog } from '../types';

type Tab = 'daily' | 'sleep' | 'heartrate';

export default function MetricsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [tab, setTab] = useState<Tab>('daily');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Daily metrics form
  const [metricsForm, setMetricsForm] = useState({
    date: today, steps: '', calories_burned: '', calories_consumed: '', water_intake_ml: '', active_minutes: '',
  });

  // Sleep form
  const [sleepForm, setSleepForm] = useState({
    date: today, sleep_start: '', sleep_end: '', quality_score: '',
  });

  // Heart rate form
  const [hrForm, setHrForm] = useState({
    bpm: '', context: 'resting', timestamp: '',
  });

  // History
  const [dailyHistory, setDailyHistory] = useState<DailyMetrics[]>([]);
  const [sleepHistory, setSleepHistory] = useState<SleepLog[]>([]);

  useEffect(() => {
    getDailyMetrics(14).then(setDailyHistory).catch(() => {});
    getSleepLogs(14).then(setSleepHistory).catch(() => {});
  }, []);

  const handleMetricsSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await logDailyMetrics({
        date: metricsForm.date,
        steps: metricsForm.steps ? Number(metricsForm.steps) : 0,
        calories_burned: metricsForm.calories_burned ? Number(metricsForm.calories_burned) : 0,
        calories_consumed: metricsForm.calories_consumed ? Number(metricsForm.calories_consumed) : 0,
        water_intake_ml: metricsForm.water_intake_ml ? Number(metricsForm.water_intake_ml) : 0,
        active_minutes: metricsForm.active_minutes ? Number(metricsForm.active_minutes) : 0,
      });
      setMsg('Daily metrics saved!');
      getDailyMetrics(14).then(setDailyHistory).catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save metrics.');
    }
  };

  const handleSleepSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      const start = new Date(sleepForm.sleep_start);
      const end = new Date(sleepForm.sleep_end);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (duration <= 0) { setError('Sleep end must be after start.'); return; }
      await logSleep({
        date: sleepForm.date,
        sleep_start: sleepForm.sleep_start + ':00',
        sleep_end: sleepForm.sleep_end + ':00',
        duration_hours: Math.round(duration * 10) / 10,
        quality_score: sleepForm.quality_score ? Number(sleepForm.quality_score) : undefined,
      });
      setMsg('Sleep log saved!');
      getSleepLogs(14).then(setSleepHistory).catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save sleep log.');
    }
  };

  const handleHrSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      await client.post('/metrics/heart-rate', {
        bpm: Number(hrForm.bpm),
        context: hrForm.context,
        timestamp: hrForm.timestamp ? new Date(hrForm.timestamp).toISOString() : undefined,
      });
      setMsg('Heart rate logged!');
      setHrForm({ bpm: '', context: 'resting', timestamp: '' });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log heart rate.');
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'daily', label: '📊 Daily Metrics' },
    { key: 'sleep', label: '😴 Sleep' },
    { key: 'heartrate', label: '❤️ Heart Rate' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Log Metrics</h1>
          <p style={styles.subtitle}>Enter data from your wearable or manually track your health stats</p>
        </div>
      </div>

      <div style={styles.tabs}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setMsg(''); setError(''); }}
            style={{ ...styles.tab, ...(tab === t.key ? styles.activeTab : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {msg && <div style={styles.success}>{msg}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {/* Daily Metrics */}
      {tab === 'daily' && (
        <div style={styles.twoCol}>
          <div>
            <form onSubmit={handleMetricsSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>Log Daily Activity</h3>
              <p style={styles.formHint}>Enter totals for the day — from your Fitbit, Apple Watch, Garmin, or manually.</p>
              <div style={styles.grid}>
                <Field label="Date" type="date" value={metricsForm.date} onChange={(v) => setMetricsForm({ ...metricsForm, date: v })} required />
                <Field label="Steps" type="number" value={metricsForm.steps} onChange={(v) => setMetricsForm({ ...metricsForm, steps: v })} placeholder="e.g. 8000" />
                <Field label="Calories Burned (kcal)" type="number" value={metricsForm.calories_burned} onChange={(v) => setMetricsForm({ ...metricsForm, calories_burned: v })} placeholder="e.g. 450" />
                <Field label="Calories Consumed (kcal)" type="number" value={metricsForm.calories_consumed} onChange={(v) => setMetricsForm({ ...metricsForm, calories_consumed: v })} placeholder="e.g. 2000" />
                <Field label="Water Intake (ml)" type="number" value={metricsForm.water_intake_ml} onChange={(v) => setMetricsForm({ ...metricsForm, water_intake_ml: v })} placeholder="e.g. 2500" />
                <Field label="Active Minutes" type="number" value={metricsForm.active_minutes} onChange={(v) => setMetricsForm({ ...metricsForm, active_minutes: v })} placeholder="e.g. 45" />
              </div>
              <button type="submit" style={styles.btn}>Save Daily Metrics</button>
            </form>
          </div>

          {/* History */}
          <div style={styles.historyBox}>
            <h3 style={styles.formTitle}>Recent History (14 days)</h3>
            {dailyHistory.length === 0 ? (
              <p style={styles.empty}>No data logged yet.</p>
            ) : (
              <div style={styles.historyList}>
                {[...dailyHistory].reverse().map((m) => (
                  <div key={m.id} style={styles.historyItem}>
                    <span style={styles.historyDate}>{m.date}</span>
                    <div style={styles.historyStats}>
                      <span>👟 {m.steps.toLocaleString()}</span>
                      <span>🔥 {m.calories_burned} kcal</span>
                      <span>💧 {Math.round(m.water_intake_ml / 100) / 10}L</span>
                      <span>⚡ {m.active_minutes} min</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sleep */}
      {tab === 'sleep' && (
        <div style={styles.twoCol}>
          <div>
            <form onSubmit={handleSleepSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>Log Sleep</h3>
              <p style={styles.formHint}>Enter sleep times from your wearable's sleep tracking or your own records.</p>
              <div style={styles.grid}>
                <Field label="Date (night of)" type="date" value={sleepForm.date} onChange={(v) => setSleepForm({ ...sleepForm, date: v })} required />
                <Field label="Sleep Start" type="datetime-local" value={sleepForm.sleep_start} onChange={(v) => setSleepForm({ ...sleepForm, sleep_start: v })} required />
                <Field label="Sleep End" type="datetime-local" value={sleepForm.sleep_end} onChange={(v) => setSleepForm({ ...sleepForm, sleep_end: v })} required />
                <Field label="Quality Score (1-10)" type="number" value={sleepForm.quality_score} onChange={(v) => setSleepForm({ ...sleepForm, quality_score: v })} placeholder="e.g. 8" />
              </div>
              <button type="submit" style={styles.btn}>Save Sleep Log</button>
            </form>
          </div>

          <div style={styles.historyBox}>
            <h3 style={styles.formTitle}>Recent Sleep History</h3>
            {sleepHistory.length === 0 ? (
              <p style={styles.empty}>No sleep logged yet.</p>
            ) : (
              <div style={styles.historyList}>
                {[...sleepHistory].reverse().map((s) => (
                  <div key={s.id} style={styles.historyItem}>
                    <span style={styles.historyDate}>{s.date}</span>
                    <div style={styles.historyStats}>
                      <span style={{ color: '#f472b6' }}>😴 {s.duration_hours}h</span>
                      {s.quality_score && <span>⭐ {s.quality_score}/10</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Heart Rate */}
      {tab === 'heartrate' && (
        <div style={styles.twoCol}>
          <div>
            <form onSubmit={handleHrSubmit} style={styles.form}>
              <h3 style={styles.formTitle}>Log Heart Rate</h3>
              <p style={styles.formHint}>Log individual heart rate readings from your wearable, chest strap, or manual measurement.</p>
              <div style={styles.grid}>
                <Field label="BPM" type="number" value={hrForm.bpm} onChange={(v) => setHrForm({ ...hrForm, bpm: v })} placeholder="e.g. 72" required />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>Context</label>
                  <select value={hrForm.context} onChange={(e) => setHrForm({ ...hrForm, context: e.target.value })} style={styles.select}>
                    <option value="resting">Resting</option>
                    <option value="active">Active / During workout</option>
                    <option value="peak">Peak / Max effort</option>
                  </select>
                </div>
                <Field label="Timestamp (optional)" type="datetime-local" value={hrForm.timestamp} onChange={(v) => setHrForm({ ...hrForm, timestamp: v })} />
              </div>

              <div style={styles.hrReference}>
                <strong style={{ color: '#94a3b8', fontSize: '13px' }}>Typical ranges:</strong>
                <div style={styles.hrRanges}>
                  <span style={{ color: '#4ade80' }}>Resting: 60–100 bpm</span>
                  <span style={{ color: '#fb923c' }}>Active: 100–160 bpm</span>
                  <span style={{ color: '#f472b6' }}>Peak: 160–220 bpm</span>
                </div>
              </div>

              <button type="submit" style={styles.btn}>Log Heart Rate</button>
            </form>
          </div>

          <div style={styles.historyBox}>
            <h3 style={styles.formTitle}>How to find your data</h3>
            <div style={styles.wearableGuide}>
              {[
                { icon: '⌚', name: 'Apple Watch', tip: 'Health app → Browse → Heart → Heart Rate' },
                { icon: '📱', name: 'Fitbit', tip: 'App → Today → Heart Rate tile' },
                { icon: '🏃', name: 'Garmin', tip: 'Garmin Connect → Health Stats → Heart Rate' },
                { icon: '👟', name: 'Google Fit', tip: 'App → Journal → Heart Points' },
                { icon: '📊', name: 'Samsung Health', tip: 'App → Heart Rate → History' },
              ].map((w) => (
                <div key={w.name} style={styles.wearableItem}>
                  <span style={{ fontSize: '20px' }}>{w.icon}</span>
                  <div>
                    <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600 }}>{w.name}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{w.tip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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
  page: { padding: '24px', maxWidth: '1100px', margin: '0 auto' },
  header: { marginBottom: '24px' },
  title: { color: '#f1f5f9', margin: 0 },
  subtitle: { color: '#64748b', fontSize: '14px', margin: '4px 0 0' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  tab: { padding: '10px 20px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },
  activeTab: { backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', borderColor: '#4ade80' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' },
  form: { backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' },
  formTitle: { color: '#f1f5f9', margin: 0, fontSize: '16px' },
  formHint: { color: '#64748b', fontSize: '13px', margin: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' },
  select: { padding: '10px 14px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px' },
  btn: { padding: '12px 24px', backgroundColor: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', alignSelf: 'flex-start' },
  success: { backgroundColor: 'rgba(74,222,128,0.1)', border: '1px solid #4ade80', color: '#4ade80', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  historyBox: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' },
  historyList: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' },
  historyItem: { backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px 14px' },
  historyDate: { color: '#38bdf8', fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '4px' },
  historyStats: { display: 'flex', gap: '14px', flexWrap: 'wrap', color: '#94a3b8', fontSize: '13px' },
  empty: { color: '#475569', fontSize: '14px', marginTop: '12px' },
  hrReference: { backgroundColor: '#0f172a', borderRadius: '8px', padding: '12px 16px' },
  hrRanges: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', fontSize: '13px' },
  wearableGuide: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' },
  wearableItem: { display: 'flex', gap: '12px', alignItems: 'flex-start', backgroundColor: '#0f172a', borderRadius: '8px', padding: '10px 14px' },
};
