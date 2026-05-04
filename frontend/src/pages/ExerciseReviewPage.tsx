import { useEffect, useRef, useState, FormEvent } from 'react';
import {
  analyzeVideo,
  chatAboutExercise,
  transcribeAudio,
  type ChatTurn,
  type ExerciseAnalysis,
  type FormIssue,
} from '../api/exerciseReview';

const SEVERITY_COLOR: Record<FormIssue['severity'], string> = {
  minor: '#38bdf8',
  moderate: '#fb923c',
  major: '#ef4444',
};

const LABEL_COLOR: Record<string, string> = {
  'Needs Work': '#ef4444',
  'Fair': '#fb923c',
  'Good': '#38bdf8',
  'Great': '#4ade80',
  'Excellent': '#a78bfa',
};

export default function ExerciseReviewPage() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ExerciseAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState('');

  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setAnalysis(null);
    setMessages([]);
    setAnalysisError('');
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setAnalysisError('');
    try {
      const result = await analyzeVideo(file);
      setAnalysis(result);
      setMessages([
        {
          role: 'assistant',
          content: `I analyzed your ${result.exercise.toLowerCase()}. ${result.summary} Want me to dive deeper into any specific issue?`,
        },
      ]);
    } catch (err: any) {
      setAnalysisError(err.response?.data?.detail || 'Analysis failed. Please try again with a shorter clip.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChat = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !analysis || chatLoading) return;
    const userMsg: ChatTurn = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setChatLoading(true);
    setChatError('');
    try {
      const reply = await chatAboutExercise(analysis, next, userMsg.content);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      setChatError(err.response?.data?.detail || 'Chat failed.');
    } finally {
      setChatLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        setTranscribing(true);
        try {
          const transcript = await transcribeAudio(blob);
          setInput((prev) => (prev ? prev + ' ' : '') + transcript);
        } catch (err: any) {
          setChatError(err.response?.data?.detail || 'Transcription failed.');
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      setChatError('Microphone access denied. Check your browser permissions.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Form Coach 📹</h1>
        <p style={styles.subtitle}>
          Upload a short clip of yourself doing an exercise — Gemini will analyze your form, point
          out issues, and give specific cues. Then ask follow-up questions by typing or with your voice.
        </p>
      </div>

      <div style={styles.layout}>
        {/* Left: Upload + video + analysis */}
        <div style={styles.leftCol}>
          <section style={styles.card}>
            <label style={styles.uploadLabel}>
              <input
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <div style={styles.uploadBox}>
                {videoUrl ? (
                  <video src={videoUrl} controls style={styles.video} />
                ) : (
                  <>
                    <div style={{ fontSize: '48px' }}>🎥</div>
                    <div style={{ fontWeight: 700, marginTop: '8px' }}>Click to upload a video</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
                      MP4, MOV, or WebM — under 100 MB, ideally 5-30 seconds
                    </div>
                  </>
                )}
              </div>
            </label>

            {file && !analysis && (
              <button onClick={handleAnalyze} disabled={analyzing} style={styles.primaryBtn}>
                {analyzing ? 'Analyzing form (this can take 30-60s)...' : '🤖 Analyze My Form'}
              </button>
            )}
            {analysisError && <div style={styles.error}>{analysisError}</div>}
          </section>

          {analysis && (
            <>
              <section style={styles.card}>
                <div style={styles.scoreRow}>
                  <div>
                    <div style={styles.exerciseName}>{analysis.exercise}</div>
                    <div style={styles.repCount}>{analysis.rep_count} rep{analysis.rep_count === 1 ? '' : 's'} detected</div>
                  </div>
                  <div style={styles.scoreBadge}>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: LABEL_COLOR[analysis.overall_label] || 'var(--accent)' }}>
                      {analysis.overall_score}/10
                    </div>
                    <div style={{ color: LABEL_COLOR[analysis.overall_label] || 'var(--accent)', fontSize: '13px', fontWeight: 600 }}>
                      {analysis.overall_label}
                    </div>
                  </div>
                </div>
                <p style={styles.summary}>{analysis.summary}</p>
              </section>

              {analysis.form_issues.length > 0 && (
                <section style={styles.card}>
                  <h3 style={styles.sectionTitle}>What to fix</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {analysis.form_issues.map((issue, i) => (
                      <div key={i} style={{ ...styles.issueBox, borderLeft: `3px solid ${SEVERITY_COLOR[issue.severity]}` }}>
                        <div style={styles.issueHeader}>
                          <span style={styles.issueText}>{issue.issue}</span>
                          <span style={{ ...styles.severityChip, color: SEVERITY_COLOR[issue.severity] }}>
                            {issue.severity}
                            {issue.timestamp_seconds !== undefined && ` · ${issue.timestamp_seconds}s`}
                          </span>
                        </div>
                        <div style={styles.fixText}>👉 {issue.fix}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {analysis.positives.length > 0 && (
                <section style={styles.card}>
                  <h3 style={styles.sectionTitle}>What's working ✅</h3>
                  <ul style={styles.bullets}>
                    {analysis.positives.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </section>
              )}

              {analysis.key_cues.length > 0 && (
                <section style={styles.card}>
                  <h3 style={styles.sectionTitle}>Key cues for next time 🎯</h3>
                  <ul style={styles.bullets}>
                    {analysis.key_cues.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </section>
              )}
            </>
          )}
        </div>

        {/* Right: Chat */}
        <div style={styles.rightCol}>
          <section style={{ ...styles.card, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h3 style={styles.sectionTitle}>Ask the Coach</h3>
            {!analysis ? (
              <div style={styles.chatPlaceholder}>
                Upload and analyze a clip to start a conversation with your form coach.
              </div>
            ) : (
              <>
                <div style={styles.messagesScroll}>
                  {messages.map((m, i) => (
                    <div key={i} style={m.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                      {m.content}
                    </div>
                  ))}
                  {chatLoading && <div style={styles.assistantBubble}>Thinking…</div>}
                  <div ref={messagesEndRef} />
                </div>

                {chatError && <div style={styles.error}>{chatError}</div>}

                <form onSubmit={handleChat} style={styles.chatForm}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={transcribing ? 'Transcribing your voice…' : 'Ask about your form, or how to fix something…'}
                    disabled={chatLoading || transcribing}
                    style={styles.chatInput}
                  />
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    disabled={transcribing || chatLoading}
                    style={{
                      ...styles.micBtn,
                      backgroundColor: recording ? '#ef4444' : 'var(--bg-input)',
                      color: recording ? '#ffffff' : 'var(--text)',
                    }}
                    title={recording ? 'Stop recording' : 'Speak your question'}
                  >
                    {recording ? '⏹' : '🎙'}
                  </button>
                  <button type="submit" disabled={chatLoading || !input.trim()} style={styles.sendBtn}>
                    Send
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: '1400px', margin: '0 auto' },
  header: { marginBottom: '20px' },
  title: { color: 'var(--text)', margin: 0, fontSize: '28px' },
  subtitle: { color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', maxWidth: '760px', lineHeight: 1.5 },
  layout: { display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '20px', alignItems: 'start' },
  leftCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  rightCol: { position: 'sticky', top: '76px', height: 'calc(100vh - 96px)' },
  card: { backgroundColor: 'var(--bg-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' },
  uploadLabel: { display: 'block', cursor: 'pointer' },
  uploadBox: { border: '2px dashed var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', color: 'var(--text)', backgroundColor: 'var(--bg-input)' },
  video: { width: '100%', maxHeight: '360px', borderRadius: '8px', backgroundColor: '#000' },
  primaryBtn: { marginTop: '12px', width: '100%', padding: '14px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' },
  scoreRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '16px' },
  exerciseName: { color: 'var(--text)', fontSize: '20px', fontWeight: 700 },
  repCount: { color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px' },
  scoreBadge: { textAlign: 'right' },
  summary: { color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 },
  sectionTitle: { color: 'var(--text)', fontSize: '15px', fontWeight: 700, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  issueBox: { backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '12px 14px' },
  issueHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' },
  issueText: { color: 'var(--text)', fontSize: '14px', fontWeight: 600 },
  severityChip: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, whiteSpace: 'nowrap' },
  fixText: { color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', lineHeight: 1.5 },
  bullets: { color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7, paddingLeft: '20px', margin: 0 },
  chatPlaceholder: { color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '32px 16px' },
  messagesScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px', minHeight: '300px', maxHeight: 'calc(100vh - 280px)' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', padding: '10px 14px', borderRadius: '14px 14px 4px 14px', maxWidth: '85%', fontSize: '14px', lineHeight: 1.5 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: 'var(--bg-input)', color: 'var(--text)', padding: '10px 14px', borderRadius: '14px 14px 14px 4px', maxWidth: '85%', fontSize: '14px', lineHeight: 1.5 },
  chatForm: { display: 'flex', gap: '8px', marginTop: '12px' },
  chatInput: { flex: 1, padding: '10px 14px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text)', fontSize: '14px', outline: 'none' },
  micBtn: { padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', fontSize: '16px', minWidth: '44px' },
  sendBtn: { padding: '10px 16px', backgroundColor: 'var(--accent)', color: 'var(--accent-dark)', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' },
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginTop: '12px' },
};
