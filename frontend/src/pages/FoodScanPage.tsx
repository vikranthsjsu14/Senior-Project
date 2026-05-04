import { useState, useRef } from 'react';
import client from '../api/client';
import { logNutrition } from '../api/nutrition';

interface FoodBreakdown {
  item: string;
  calories: number;
  protein_g?: number;
}

interface HealthierSwap {
  current: string;
  swap: string;
  calories_saved: number;
}

interface FoodAnalysis {
  food_name: string;
  description: string;
  estimated_calories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  portion_size: string;
  meal_quality_score: number;
  meal_quality_label: string;
  breakdown: FoodBreakdown[];
  healthier_swaps: HealthierSwap[];
  positives: string[];
  improvements: string[];
  vitamins_minerals: string[];
}

const QUALITY_COLORS: Record<string, string> = {
  Poor: '#ef4444',
  Fair: '#fb923c',
  Good: '#facc15',
  Great: 'var(--accent)',
  Excellent: '#22d3ee',
};

export default function FoodScanPage() {
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [logged, setLogged] = useState(false);
  const [logMsg, setLogMsg] = useState('');
  const [showCorrection, setShowCorrection] = useState(false);
  const [correction, setCorrection] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload and analyze
    setLoading(true);
    setError('');
    setAnalysis(null);
    setLogged(false);
    setLogMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await client.post<{ analysis: FoodAnalysis }>('/food-scan/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysis(res.data.analysis);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleLogMeal = async (mealType: string) => {
    if (!analysis) return;
    try {
      await logNutrition({
        date: new Date().toISOString().split('T')[0],
        meal_type: mealType,
        food_name: analysis.food_name,
        calories: analysis.estimated_calories,
        protein_g: analysis.macros.protein_g,
        carbs_g: analysis.macros.carbs_g,
        fat_g: analysis.macros.fat_g,
      });
      setLogged(true);
      setLogMsg(`Logged as ${mealType}!`);
    } catch {
      setLogMsg('Failed to log meal.');
    }
  };

  const handleCorrection = async () => {
    if (!analysis || !correction.trim()) return;
    setCorrecting(true);
    setError('');
    try {
      const res = await client.post<{ analysis: FoodAnalysis }>('/food-scan/correct', {
        correction: correction.trim(),
        original_analysis: analysis,
      });
      setAnalysis(res.data.analysis);
      setCorrection('');
      setShowCorrection(false);
      setLogged(false);
      setLogMsg('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Correction failed. Please try again.');
    } finally {
      setCorrecting(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setPreview(null);
    setError('');
    setLogged(false);
    setLogMsg('');
    setShowCorrection(false);
    setCorrection('');
  };

  const qualityColor = analysis ? (QUALITY_COLORS[analysis.meal_quality_label] || 'var(--text-secondary)') : 'var(--text-secondary)';

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Food Scanner</h1>
          <p style={styles.subtitle}>Snap a photo of your food and AI will estimate calories, macros, and suggest healthier swaps</p>
        </div>
        {analysis && (
          <button onClick={reset} style={styles.resetBtn}>
            Scan Another
          </button>
        )}
      </div>

      {/* Upload Area */}
      {!analysis && !loading && (
        <div
          style={styles.dropZone}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {preview ? (
            <img src={preview} alt="Food preview" style={styles.previewImg} />
          ) : (
            <>
              <div style={styles.uploadIcon}>📸</div>
              <h3 style={styles.dropTitle}>Upload or take a photo of your food</h3>
              <p style={styles.dropText}>Drag & drop an image here, or use the buttons below</p>
            </>
          )}

          <div style={styles.uploadBtns}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <button onClick={() => fileInputRef.current?.click()} style={styles.uploadBtn}>
              🖼️ Choose Photo
            </button>
            <button onClick={() => cameraInputRef.current?.click()} style={styles.cameraBtn}>
              📷 Take Photo
            </button>
          </div>
        </div>
      )}

      {error && <div style={styles.error}>{error}</div>}

      {/* Loading */}
      {loading && (
        <div style={styles.loadingCard}>
          {preview && <img src={preview} alt="Analyzing..." style={styles.loadingImg} />}
          <div style={styles.loadingContent}>
            <div style={styles.spinner}>🔍</div>
            <div style={styles.loadingText}>Analyzing your food...</div>
            <div style={styles.loadingSubtext}>Estimating calories, macros, and nutritional quality</div>
          </div>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div style={styles.results}>
          {/* Top Row: Image + Summary */}
          <div style={styles.topRow}>
            {preview && (
              <div style={styles.resultImgWrapper}>
                <img src={preview} alt={analysis.food_name} style={styles.resultImg} />
              </div>
            )}
            <div style={styles.summaryCard}>
              <h2 style={styles.foodName}>{analysis.food_name}</h2>
              <p style={styles.description}>{analysis.description}</p>
              <p style={styles.portion}>Portion: {analysis.portion_size}</p>

              {/* Correction */}
              {!showCorrection ? (
                <button onClick={() => setShowCorrection(true)} style={styles.correctToggle}>
                  ✏️ Wrong? Correct this
                </button>
              ) : (
                <div style={styles.correctionBox}>
                  <label style={styles.correctionLabel}>What should be corrected?</label>
                  <input
                    type="text"
                    value={correction}
                    onChange={(e) => setCorrection(e.target.value)}
                    placeholder="e.g. That's lamb not beef, or There's also rice on the plate"
                    style={styles.correctionInput}
                    onKeyDown={(e) => e.key === 'Enter' && handleCorrection()}
                    disabled={correcting}
                  />
                  <div style={styles.correctionBtns}>
                    <button onClick={handleCorrection} style={styles.correctionSubmit} disabled={correcting || !correction.trim()}>
                      {correcting ? '⏳ Updating...' : '✓ Update Analysis'}
                    </button>
                    <button onClick={() => { setShowCorrection(false); setCorrection(''); }} style={styles.correctionCancel} disabled={correcting}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Quality Score */}
              <div style={styles.qualityRow}>
                <div style={{ ...styles.qualityBadge, backgroundColor: qualityColor + '20', borderColor: qualityColor, color: qualityColor }}>
                  <span style={styles.qualityScore}>{analysis.meal_quality_score}</span>/10
                </div>
                <span style={{ color: qualityColor, fontWeight: 600, fontSize: '16px' }}>
                  {analysis.meal_quality_label}
                </span>
              </div>

              {/* Quick Log */}
              <div style={styles.logSection}>
                {!logged ? (
                  <>
                    <span style={styles.logLabel}>Quick log as:</span>
                    <div style={styles.logBtns}>
                      {['breakfast', 'lunch', 'dinner', 'snack'].map((m) => (
                        <button key={m} onClick={() => handleLogMeal(m)} style={styles.logBtn}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={styles.logSuccess}>{logMsg}</div>
                )}
              </div>
            </div>
          </div>

          {/* Calories & Macros */}
          <div style={styles.macroCards}>
            <MacroCard label="Calories" value={analysis.estimated_calories} unit="kcal" color="#fb923c" big />
            <MacroCard label="Protein" value={analysis.macros.protein_g} unit="g" color="var(--accent)" />
            <MacroCard label="Carbs" value={analysis.macros.carbs_g} unit="g" color="#38bdf8" />
            <MacroCard label="Fat" value={analysis.macros.fat_g} unit="g" color="#f472b6" />
            <MacroCard label="Fiber" value={analysis.macros.fiber_g} unit="g" color="#a78bfa" />
          </div>

          {/* Breakdown */}
          {analysis.breakdown.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Breakdown</h3>
              <div style={styles.breakdownList}>
                {analysis.breakdown.map((item, i) => (
                  <div key={i} style={styles.breakdownItem}>
                    <span style={styles.breakdownName}>{item.item}</span>
                    <div style={styles.breakdownRight}>
                      <span style={{ color: '#fb923c' }}>{item.calories} kcal</span>
                      {item.protein_g != null && <span style={{ color: 'var(--accent)' }}>{item.protein_g}g protein</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Healthier Swaps */}
          {analysis.healthier_swaps.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Healthier Swaps</h3>
              <div style={styles.swapGrid}>
                {analysis.healthier_swaps.map((swap, i) => (
                  <div key={i} style={styles.swapCard}>
                    <div style={styles.swapFrom}>
                      <span style={styles.swapLabel}>Instead of</span>
                      <span style={styles.swapCurrent}>{swap.current}</span>
                    </div>
                    <div style={styles.swapArrow}>→</div>
                    <div style={styles.swapTo}>
                      <span style={styles.swapLabel}>Try</span>
                      <span style={styles.swapNew}>{swap.swap}</span>
                    </div>
                    <div style={styles.swapSave}>
                      Save ~{swap.calories_saved} kcal
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Positives & Improvements */}
          <div style={styles.feedbackRow}>
            {analysis.positives.length > 0 && (
              <div style={styles.feedbackCard}>
                <h4 style={{ color: 'var(--accent)', margin: '0 0 10px' }}>What's Good</h4>
                <ul style={styles.feedbackList}>
                  {analysis.positives.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            )}
            {analysis.improvements.length > 0 && (
              <div style={styles.feedbackCard}>
                <h4 style={{ color: '#fb923c', margin: '0 0 10px' }}>Could Be Better</h4>
                <ul style={styles.feedbackList}>
                  {analysis.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Vitamins */}
          {analysis.vitamins_minerals.length > 0 && (
            <section style={styles.section}>
              <h3 style={styles.sectionTitle}>Key Nutrients</h3>
              <div style={styles.vitaminChips}>
                {analysis.vitamins_minerals.map((v, i) => (
                  <span key={i} style={styles.vitaminChip}>{v}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function MacroCard({ label, value, unit, color, big }: { label: string; value: number; unit: string; color: string; big?: boolean }) {
  return (
    <div style={{ ...styles.macroCard, borderTop: `3px solid ${color}` }}>
      <span style={styles.macroLabel}>{label}</span>
      <span style={{ color, fontSize: big ? '32px' : '26px', fontWeight: 700 }}>{value}</span>
      <span style={styles.macroUnit}>{unit}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: '1000px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { color: 'var(--text)', margin: 0, fontSize: '28px' },
  subtitle: { color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '14px' },
  resetBtn: { padding: '10px 20px', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' },

  // Upload
  dropZone: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '2px dashed var(--border)', padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'border-color 0.2s' },
  uploadIcon: { fontSize: '64px' },
  dropTitle: { color: 'var(--text)', margin: 0, fontSize: '20px' },
  dropText: { color: 'var(--text-muted)', margin: 0, fontSize: '14px' },
  previewImg: { maxHeight: '200px', borderRadius: '12px', objectFit: 'cover' },
  uploadBtns: { display: 'flex', gap: '12px', marginTop: '8px' },
  uploadBtn: { padding: '12px 24px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' },
  cameraBtn: { padding: '12px 24px', backgroundColor: '#38bdf8', color: 'var(--accent-dark)', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' },

  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginTop: '16px', fontSize: '14px' },

  // Loading
  loadingCard: { display: 'flex', gap: '24px', backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '32px', marginTop: '20px', alignItems: 'center' },
  loadingImg: { width: '150px', height: '150px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 },
  loadingContent: { display: 'flex', flexDirection: 'column', gap: '8px' },
  spinner: { fontSize: '40px' },
  loadingText: { color: 'var(--text)', fontSize: '18px', fontWeight: 600 },
  loadingSubtext: { color: 'var(--text-muted)', fontSize: '14px' },

  // Results
  results: { display: 'flex', flexDirection: 'column', gap: '20px' },
  topRow: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' },
  resultImgWrapper: { borderRadius: '16px', overflow: 'hidden' },
  resultImg: { width: '100%', height: '280px', objectFit: 'cover', display: 'block' },
  summaryCard: { backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' },
  foodName: { color: 'var(--text)', margin: 0, fontSize: '24px' },
  description: { color: 'var(--text-secondary)', margin: 0, fontSize: '14px', lineHeight: '1.5' },
  portion: { color: 'var(--text-muted)', fontSize: '13px', margin: 0 },

  correctToggle: { padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start', marginTop: '4px' },
  correctionBox: { backgroundColor: 'var(--bg-input)', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' },
  correctionLabel: { color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 500 },
  correctionInput: { padding: '10px 14px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '14px', outline: 'none', width: '100%' },
  correctionBtns: { display: 'flex', gap: '8px' },
  correctionSubmit: { padding: '8px 16px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' },
  correctionCancel: { padding: '8px 16px', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  qualityRow: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' },
  qualityBadge: { border: '2px solid', borderRadius: '12px', padding: '8px 14px', fontWeight: 700, fontSize: '18px' },
  qualityScore: { fontSize: '24px' },

  logSection: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--bg-input)' },
  logLabel: { color: 'var(--text-muted)', fontSize: '13px' },
  logBtns: { display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' },
  logBtn: { padding: '6px 14px', backgroundColor: 'var(--bg-input)', color: 'var(--accent)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' },
  logSuccess: { color: 'var(--accent)', fontSize: '14px', fontWeight: 600 },

  // Macros
  macroCards: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' },
  macroCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px' },
  macroLabel: { color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 },
  macroUnit: { color: 'var(--text-dim)', fontSize: '12px' },

  // Breakdown
  section: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px' },
  sectionTitle: { color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 12px' },
  breakdownList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  breakdownItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' },
  breakdownName: { color: 'var(--text)', fontSize: '14px' },
  breakdownRight: { display: 'flex', gap: '16px', fontSize: '13px' },

  // Swaps
  swapGrid: { display: 'flex', flexDirection: 'column', gap: '10px' },
  swapCard: { display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '12px', alignItems: 'center', padding: '14px', backgroundColor: 'var(--bg-input)', borderRadius: '10px' },
  swapFrom: { display: 'flex', flexDirection: 'column', gap: '2px' },
  swapTo: { display: 'flex', flexDirection: 'column', gap: '2px' },
  swapLabel: { color: 'var(--text-dim)', fontSize: '11px', textTransform: 'uppercase' },
  swapCurrent: { color: '#f87171', fontSize: '14px' },
  swapArrow: { color: 'var(--accent)', fontSize: '20px', fontWeight: 700 },
  swapNew: { color: 'var(--accent)', fontSize: '14px', fontWeight: 600 },
  swapSave: { color: 'var(--accent)', fontSize: '12px', fontWeight: 600, backgroundColor: 'rgba(74,222,128,0.1)', padding: '4px 10px', borderRadius: '12px', whiteSpace: 'nowrap' },

  // Feedback
  feedbackRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  feedbackCard: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px' },
  feedbackList: { paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px' },

  // Vitamins
  vitaminChips: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  vitaminChip: { padding: '6px 14px', backgroundColor: 'var(--bg-input)', color: '#a78bfa', borderRadius: '20px', fontSize: '13px', border: '1px solid rgba(167,139,250,0.3)' },
};
