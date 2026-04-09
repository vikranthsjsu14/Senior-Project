import { useState, useRef, useEffect, FormEvent } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { generateRecommendations } from '../api/recommendations';
import { AIRecommendationData } from '../types';
import client from '../api/client';
import jsPDF from 'jspdf';

const INTENSITIES: Record<string, string> = { low: '🟢', moderate: '🟡', high: '🔴', rest: '⚫' };

type Tab = 'chat' | 'plan';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_PLAN: AIRecommendationData = {
  workout_plan: {
    weekly_schedule: [
      { day: 'Monday', workout: 'Brisk Walking / Light Jog', duration_minutes: 30, intensity: 'moderate' },
      { day: 'Tuesday', workout: 'Bodyweight Strength (Push-ups, Squats, Lunges)', duration_minutes: 25, intensity: 'moderate' },
      { day: 'Wednesday', workout: 'Active Recovery — Stretching / Yoga', duration_minutes: 20, intensity: 'low' },
      { day: 'Thursday', workout: 'Interval Training (Walk/Jog intervals)', duration_minutes: 30, intensity: 'high' },
      { day: 'Friday', workout: 'Upper & Lower Body Strength', duration_minutes: 30, intensity: 'moderate' },
      { day: 'Saturday', workout: 'Outdoor Activity (Cycling, Hiking, Swimming)', duration_minutes: 45, intensity: 'moderate' },
      { day: 'Sunday', workout: 'Rest Day', duration_minutes: 0, intensity: 'rest' },
    ],
    key_exercises: ['Squats', 'Push-ups', 'Lunges', 'Planks', 'Brisk Walking', 'Stretching'],
    rationale: 'This balanced starter plan combines cardio and strength training across the week with rest and recovery built in. It\'s suitable for most fitness levels and can be adjusted as you progress.',
  },
  nutrition_advice: {
    daily_calorie_target: 2000,
    macro_targets: { protein_g: 120, carbs_g: 225, fat_g: 65 },
    meal_suggestions: [
      { meal: 'Breakfast', example: 'Oatmeal with banana, berries, and a scoop of peanut butter', calories: 450 },
      { meal: 'Lunch', example: 'Grilled chicken salad with quinoa, mixed greens, and vinaigrette', calories: 550 },
      { meal: 'Snack', example: 'Greek yogurt with honey and almonds', calories: 200 },
      { meal: 'Dinner', example: 'Baked salmon with roasted vegetables and brown rice', calories: 600 },
    ],
    foods_to_focus_on: ['Lean proteins (chicken, fish, tofu)', 'Whole grains (oats, brown rice, quinoa)', 'Fruits & vegetables', 'Nuts & seeds', 'Legumes (beans, lentils)', 'Water (2+ liters/day)'],
    foods_to_limit: ['Sugary drinks & sodas', 'Processed snacks & fast food', 'Excess alcohol', 'Refined carbs (white bread, pastries)', 'High-sodium packaged foods'],
    rationale: 'A balanced 2000 kcal plan with adequate protein for muscle maintenance, complex carbs for energy, and healthy fats. Adjust portions based on your specific goals and activity level.',
  },
  insights: [
    'Start with this general plan and log your meals and workouts for a week to build your baseline data.',
    'Aim for at least 7-8 hours of sleep each night to support recovery and energy levels.',
    'Stay hydrated — drink water before, during, and after workouts.',
    'Chat with your AI Coach or hit "Personalize with AI" to get a plan tailored to your exact data and goals.',
  ],
  warnings: [],
};

export default function RecommendationsPage() {
  const [tab, setTab] = useState<Tab>('chat');

  // Plan state — starts with default plan
  const [data, setData] = useState<AIRecommendationData>(DEFAULT_PLAN);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [generatedAt, setGeneratedAt] = useState('');
  const [planError, setPlanError] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

  // Chat state
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: "Hi! I'm your AI Health Coach. I have access to your health data and profile, so feel free to ask me anything about your fitness, nutrition, sleep, or wellness goals.\n\nYou already have a starter workout & nutrition plan available — check the Full Plan tab! When you're ready for a plan personalized to your exact data, just ask me or hit the \"Personalize with AI\" button." },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Try to load a cached AI plan on mount (won't call AI if none exists)
  useEffect(() => {
    loadCachedPlan();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCachedPlan = async () => {
    try {
      const result = await generateRecommendations('full', false);
      if (result.data) {
        setData(result.data);
        setIsPersonalized(true);
        setCached(result.cached);
        setGeneratedAt(new Date(result.generated_at).toLocaleString());
      }
    } catch {
      // No cached plan — keep default, that's fine
    }
  };

  const handleGenerate = async (forceRefresh = false) => {
    setPlanLoading(true);
    setPlanError('');
    try {
      const result = await generateRecommendations('full', forceRefresh);
      setData(result.data);
      setIsPersonalized(true);
      setCached(result.cached);
      setGeneratedAt(new Date(result.generated_at).toLocaleString());
    } catch (err: any) {
      setPlanError(err.response?.data?.detail || 'Failed to generate recommendations. Make sure your profile is complete.');
    } finally {
      setPlanLoading(false);
    }
  };

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMsg: ChatMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setChatLoading(true);

    try {
      const res = await client.post<{ reply: string }>('/chat', { messages: newMessages });
      setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const quickQuestions = [
    "How can I improve my sleep?",
    "What should I eat before a workout?",
    "Am I hitting my fitness goals?",
    "How many calories should I eat today?",
    "Suggest a quick 20-minute workout",
    "How's my progress this week?",
  ];

  // ===== EXPORT FUNCTIONS =====
  const buildPlanText = (d: AIRecommendationData): string => {
    let text = '═══════════════════════════════════════\n';
    text += '         HEALTHAI — YOUR PERSONAL PLAN\n';
    text += `         Generated: ${generatedAt || new Date().toLocaleString()}\n`;
    text += '═══════════════════════════════════════\n\n';

    if (d.warnings.length > 0) {
      text += '⚠️  IMPORTANT NOTES\n';
      text += '───────────────────\n';
      d.warnings.forEach(w => { text += `• ${w}\n`; });
      text += '\n';
    }

    if (d.insights.length > 0) {
      text += '💡 INSIGHTS\n';
      text += '───────────────────\n';
      d.insights.forEach((ins, i) => { text += `${i + 1}. ${ins}\n`; });
      text += '\n';
    }

    text += '🏋️ WEEKLY WORKOUT PLAN\n';
    text += '───────────────────\n';
    d.workout_plan.weekly_schedule.forEach(day => {
      text += `${day.day.padEnd(12)} ${day.workout} (${day.duration_minutes} min, ${day.intensity})\n`;
    });
    text += `\nRationale: ${d.workout_plan.rationale}\n`;
    if (d.workout_plan.key_exercises.length > 0) {
      text += `Key exercises: ${d.workout_plan.key_exercises.join(', ')}\n`;
    }
    text += '\n';

    text += '🥗 NUTRITION ADVICE\n';
    text += '───────────────────\n';
    text += `Daily calorie target: ${d.nutrition_advice.daily_calorie_target} kcal\n`;
    text += `Protein: ${d.nutrition_advice.macro_targets.protein_g}g | Carbs: ${d.nutrition_advice.macro_targets.carbs_g}g | Fat: ${d.nutrition_advice.macro_targets.fat_g}g\n\n`;

    text += 'Meal suggestions:\n';
    d.nutrition_advice.meal_suggestions.forEach(m => {
      text += `  ${m.meal}: ${m.example} (~${m.calories} kcal)\n`;
    });
    text += '\n';

    text += `Foods to focus on: ${d.nutrition_advice.foods_to_focus_on.join(', ')}\n`;
    text += `Foods to limit: ${d.nutrition_advice.foods_to_limit.join(', ')}\n\n`;
    text += `Rationale: ${d.nutrition_advice.rationale}\n`;

    text += '\n═══════════════════════════════════════\n';
    text += '  Powered by HealthAI + Claude AI\n';
    text += '═══════════════════════════════════════\n';
    return text;
  };

  const exportPDF = () => {
    if (!data) return;
    const pdf = new jsPDF();
    const margin = 20;
    let y = 20;
    const lineHeight = 6;
    const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;

    const addText = (text: string, size = 10, bold = false, color: [number, number, number] = [240, 240, 240]) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      pdf.setTextColor(...color);
      const lines = pdf.splitTextToSize(text, pageWidth);
      for (const line of lines) {
        if (y > 275) { pdf.addPage(); y = 20; addBg(pdf); }
        pdf.text(line, margin, y);
        y += lineHeight;
      }
    };

    const addBg = (doc: jsPDF) => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
    };

    const addSection = (title: string) => {
      y += 4;
      if (y > 265) { pdf.addPage(); y = 20; addBg(pdf); }
      addText(title, 14, true, [74, 222, 128]);
      y += 2;
    };

    addBg(pdf);
    addText('HEALTHAI — YOUR PERSONAL PLAN', 18, true, [74, 222, 128]);
    y += 2;
    addText(`Generated: ${generatedAt || new Date().toLocaleString()}`, 9, false, [100, 116, 139]);
    y += 6;

    if (data.warnings.length > 0) {
      addSection('⚠ Important Notes');
      data.warnings.forEach(w => addText(`• ${w}`, 10, false, [253, 186, 116]));
    }

    if (data.insights.length > 0) {
      addSection('Insights');
      data.insights.forEach((ins, i) => addText(`${i + 1}. ${ins}`, 10, false, [203, 213, 225]));
    }

    addSection('Weekly Workout Plan');
    data.workout_plan.weekly_schedule.forEach(day => {
      addText(`${day.day}: ${day.workout} (${day.duration_minutes} min, ${day.intensity})`, 10, false, [226, 232, 240]);
    });
    y += 2;
    addText(`Rationale: ${data.workout_plan.rationale}`, 9, false, [148, 163, 184]);
    if (data.workout_plan.key_exercises.length > 0) {
      addText(`Key exercises: ${data.workout_plan.key_exercises.join(', ')}`, 9, false, [148, 163, 184]);
    }

    addSection('Nutrition Advice');
    addText(`Daily calorie target: ${data.nutrition_advice.daily_calorie_target} kcal`, 11, true, [226, 232, 240]);
    addText(`Protein: ${data.nutrition_advice.macro_targets.protein_g}g  |  Carbs: ${data.nutrition_advice.macro_targets.carbs_g}g  |  Fat: ${data.nutrition_advice.macro_targets.fat_g}g`, 10, false, [226, 232, 240]);
    y += 3;

    addText('Meal Suggestions:', 10, true, [56, 189, 248]);
    data.nutrition_advice.meal_suggestions.forEach(m => {
      addText(`  ${m.meal}: ${m.example} (~${m.calories} kcal)`, 10, false, [203, 213, 225]);
    });
    y += 2;

    addText(`Focus on: ${data.nutrition_advice.foods_to_focus_on.join(', ')}`, 9, false, [74, 222, 128]);
    addText(`Limit: ${data.nutrition_advice.foods_to_limit.join(', ')}`, 9, false, [248, 113, 113]);
    y += 2;
    addText(`Rationale: ${data.nutrition_advice.rationale}`, 9, false, [148, 163, 184]);

    y += 8;
    addText('Powered by HealthAI + Claude AI', 8, false, [71, 85, 105]);

    pdf.save('HealthAI_Plan.pdf');
  };

  const exportText = () => {
    if (!data) return;
    const text = buildPlanText(data);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HealthAI_Plan.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HealthAI_Plan.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!data) return;
    navigator.clipboard.writeText(buildPlanText(data));
    setCopyMsg('Copied to clipboard!');
    setTimeout(() => setCopyMsg(''), 2000);
  };

  const macroData = data ? [
    { name: 'Protein', value: data.nutrition_advice.macro_targets.protein_g, color: '#4ade80' },
    { name: 'Carbs', value: data.nutrition_advice.macro_targets.carbs_g, color: '#38bdf8' },
    { name: 'Fat', value: data.nutrition_advice.macro_targets.fat_g, color: '#f472b6' },
  ] : [];

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>AI Health Coach</h1>
          <p style={styles.subtitle}>Chat with your personal coach or generate a full plan</p>
        </div>
      </div>

      <div style={styles.tabs}>
        <button onClick={() => setTab('chat')} style={{ ...styles.tab, ...(tab === 'chat' ? styles.activeTab : {}) }}>
          💬 Chat with Coach
        </button>
        <button onClick={() => setTab('plan')} style={{ ...styles.tab, ...(tab === 'plan' ? styles.activeTab : {}) }}>
          📋 Full Plan
        </button>
      </div>

      {/* ========== CHAT TAB ========== */}
      {tab === 'chat' && (
        <div style={styles.chatLayout}>
          <div style={styles.chatContainer}>
            <div style={styles.chatMessages}>
              {messages.map((msg, i) => (
                <div key={i} style={msg.role === 'user' ? styles.userMsgRow : styles.assistantMsgRow}>
                  {msg.role === 'assistant' && <div style={styles.avatar}>🤖</div>}
                  <div style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                    {msg.content.split('\n').map((line, j) => (
                      <p key={j} style={{ margin: j === 0 ? 0 : '8px 0 0' }}>{line}</p>
                    ))}
                  </div>
                  {msg.role === 'user' && <div style={styles.userAvatar}>👤</div>}
                </div>
              ))}
              {chatLoading && (
                <div style={styles.assistantMsgRow}>
                  <div style={styles.avatar}>🤖</div>
                  <div style={styles.typingBubble}>
                    <span style={styles.dot}>●</span>
                    <span style={{ ...styles.dot, animationDelay: '0.2s' }}>●</span>
                    <span style={{ ...styles.dot, animationDelay: '0.4s' }}>●</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Regenerate banner after chatting */}
            {messages.length > 3 && (
              <div style={styles.regenBanner}>
                <span style={styles.regenText}>{isPersonalized ? 'Update your plan based on this conversation.' : 'Ready to personalize your plan with AI?'}</span>
                <button
                  onClick={() => { handleGenerate(true); }}
                  style={styles.regenBtn}
                  disabled={planLoading}
                >
                  {planLoading ? '⏳ Updating...' : isPersonalized ? '🔄 Regenerate Plan' : '✨ Personalize Plan'}
                </button>
              </div>
            )}

            <form onSubmit={handleChatSubmit} style={styles.chatInputRow}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your health coach anything..."
                style={styles.chatInput}
                disabled={chatLoading}
              />
              <button type="submit" style={styles.sendBtn} disabled={chatLoading || !input.trim()}>
                ➤
              </button>
            </form>
          </div>

          <div style={styles.quickPanel}>
            <h3 style={styles.quickTitle}>Quick Questions</h3>
            <div style={styles.quickList}>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(q); }}
                  style={styles.quickBtn}
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Compact current plan summary */}
            {data && (
              <div style={styles.miniPlanBox}>
                <h4 style={styles.tipsTitle}>Current Plan</h4>
                <div style={styles.miniPlanItem}>
                  <span style={{ color: '#fb923c', fontWeight: 700 }}>{data.nutrition_advice.daily_calorie_target}</span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}> kcal/day target</span>
                </div>
                <div style={styles.miniMacros}>
                  <span style={{ color: '#4ade80' }}>P {data.nutrition_advice.macro_targets.protein_g}g</span>
                  <span style={{ color: '#38bdf8' }}>C {data.nutrition_advice.macro_targets.carbs_g}g</span>
                  <span style={{ color: '#f472b6' }}>F {data.nutrition_advice.macro_targets.fat_g}g</span>
                </div>
                <div style={styles.miniWorkouts}>
                  {data.workout_plan.weekly_schedule.slice(0, 4).map((d, i) => (
                    <div key={i} style={styles.miniDay}>
                      <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 600 }}>{d.day.slice(0, 3)}</span>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>{d.duration_minutes}m</span>
                    </div>
                  ))}
                  {data.workout_plan.weekly_schedule.length > 4 && (
                    <div style={styles.miniDay}>
                      <span style={{ color: '#64748b', fontSize: '11px' }}>+{data.workout_plan.weekly_schedule.length - 4} more</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setTab('plan')} style={styles.viewPlanBtn}>
                  View Full Plan →
                </button>
              </div>
            )}

            <div style={styles.tipsBox}>
              <h4 style={styles.tipsTitle}>Tips</h4>
              <ul style={styles.tipsList}>
                <li>The coach can see your real health data</li>
                <li>Ask follow-up questions for more detail</li>
                <li>Request specific meal or workout ideas</li>
                <li>Chat, then hit "Regenerate Plan" to update</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ========== PLAN TAB ========== */}
      {tab === 'plan' && (
        <>
          {/* Personalization banner */}
          {!isPersonalized && (
            <div style={styles.defaultBanner}>
              <div style={styles.defaultBannerLeft}>
                <span style={styles.defaultBadge}>📋 Starter Plan</span>
                <span style={styles.defaultBannerText}>
                  This is a general-purpose plan. Personalize it with AI to match your exact profile, goals, and health data.
                </span>
              </div>
              <button onClick={() => handleGenerate(true)} style={styles.personalizeBtn} disabled={planLoading}>
                {planLoading ? '⏳ Personalizing...' : '✨ Personalize with AI'}
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            {isPersonalized && (
              <button onClick={() => handleGenerate(true)} style={styles.refreshBtn} disabled={planLoading}>
                🔄 Regenerate
              </button>
            )}

            <div style={styles.exportDivider} />
            <button onClick={exportPDF} style={styles.exportBtn} title="Download as PDF">
              📄 PDF
            </button>
            <button onClick={exportText} style={styles.exportBtn} title="Download as text file">
              📝 Text
            </button>
            <button onClick={exportJSON} style={styles.exportBtn} title="Download raw data as JSON">
              💾 JSON
            </button>
            <button onClick={copyToClipboard} style={styles.exportBtn} title="Copy to clipboard">
              📋 Copy
            </button>
            {copyMsg && <span style={styles.copyToast}>{copyMsg}</span>}
          </div>

          {planError && <div style={styles.error}>{planError}</div>}

          {planLoading && (
            <div style={styles.loadingCard}>
              <div style={styles.loadingSpinner}>⏳</div>
              <div style={styles.loadingText}>Claude is personalizing your plan...</div>
              <div style={styles.loadingSubtext}>Analyzing your health data — this may take a few seconds.</div>
            </div>
          )}

          {!planLoading && (
            <>
              {isPersonalized && (
                <div style={styles.metaBar}>
                  <span style={styles.freshBadge}>✨ AI Personalized</span>
                  <span style={styles.metaText}>Generated: {generatedAt}</span>
                </div>
              )}

              {data.warnings.length > 0 && (
                <div style={styles.warningBox}>
                  <strong>⚠️ Important Notes:</strong>
                  <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                    {data.warnings.map((w, i) => <li key={i} style={styles.warningItem}>{w}</li>)}
                  </ul>
                </div>
              )}

              {data.insights.length > 0 && (
                <section style={styles.section}>
                  <h2 style={styles.sectionTitle}>💡 Insights</h2>
                  <div style={styles.insightGrid}>
                    {data.insights.map((insight, i) => (
                      <div key={i} style={styles.insightCard}>
                        <span style={styles.insightNum}>{i + 1}</span>
                        <span style={styles.insightText}>{insight}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🏋️ Weekly Workout Plan</h2>
                <div style={styles.weekGrid}>
                  {data.workout_plan.weekly_schedule.map((day, i) => (
                    <div key={i} style={styles.dayCard}>
                      <div style={styles.dayLabel}>{day.day}</div>
                      <div style={styles.dayWorkout}>{day.workout}</div>
                      <div style={styles.dayMeta}>
                        {INTENSITIES[day.intensity] || '🔵'} {day.intensity} • {day.duration_minutes} min
                      </div>
                    </div>
                  ))}
                </div>
                <div style={styles.rationaleBox}>
                  <strong style={{ color: '#94a3b8' }}>Why this plan? </strong>
                  <span style={{ color: '#cbd5e1' }}>{data.workout_plan.rationale}</span>
                </div>
                {data.workout_plan.key_exercises.length > 0 && (
                  <div style={styles.exerciseList}>
                    <strong style={{ color: '#94a3b8', fontSize: '13px' }}>Key exercises: </strong>
                    {data.workout_plan.key_exercises.map((ex, i) => (
                      <span key={i} style={styles.exerciseTag}>{ex}</span>
                    ))}
                  </div>
                )}
              </section>

              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🥗 Nutrition Advice</h2>
                <div style={styles.nutritionLayout}>
                  <div style={styles.nutritionLeft}>
                    <div style={styles.calorieTarget}>
                      <div style={styles.calorieNum}>{data.nutrition_advice.daily_calorie_target}</div>
                      <div style={styles.calorieLabel}>daily calories</div>
                    </div>
                    <div>
                      <MacroRow label="Protein" value={data.nutrition_advice.macro_targets.protein_g} unit="g" color="#4ade80" />
                      <MacroRow label="Carbs" value={data.nutrition_advice.macro_targets.carbs_g} unit="g" color="#38bdf8" />
                      <MacroRow label="Fat" value={data.nutrition_advice.macro_targets.fat_g} unit="g" color="#f472b6" />
                    </div>
                  </div>
                  <div style={styles.pieWrapper}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={macroData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {macroData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={styles.subTitle}>Meal Suggestions</h3>
                  <div style={styles.mealGrid}>
                    {data.nutrition_advice.meal_suggestions.map((meal, i) => (
                      <div key={i} style={styles.mealCard}>
                        <div style={styles.mealName}>{meal.meal}</div>
                        <div style={styles.mealExample}>{meal.example}</div>
                        <div style={styles.mealCal}>{meal.calories} kcal</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={styles.foodLists}>
                  <div>
                    <h4 style={{ color: '#4ade80', marginBottom: '8px' }}>✅ Focus on</h4>
                    <ul style={styles.foodList}>
                      {data.nutrition_advice.foods_to_focus_on.map((f, i) => <li key={i} style={{ color: '#94a3b8', fontSize: '14px' }}>{f}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 style={{ color: '#f87171', marginBottom: '8px' }}>⚠️ Limit</h4>
                    <ul style={styles.foodList}>
                      {data.nutrition_advice.foods_to_limit.map((f, i) => <li key={i} style={{ color: '#94a3b8', fontSize: '14px' }}>{f}</li>)}
                    </ul>
                  </div>
                </div>

                <div style={styles.rationaleBox}>
                  <strong style={{ color: '#94a3b8' }}>Why this plan? </strong>
                  <span style={{ color: '#cbd5e1' }}>{data.nutrition_advice.rationale}</span>
                </div>
              </section>
            </>
          )}

        </>
      )}
    </div>
  );
}

function MacroRow({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0f172a' }}>
      <span style={{ color: '#94a3b8', fontSize: '14px' }}>{label}</span>
      <span style={{ color, fontWeight: 600, fontSize: '16px' }}>{value}<span style={{ color: '#64748b', fontSize: '12px', fontWeight: 400 }}> {unit}</span></span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '20px' },
  title: { color: '#f1f5f9', margin: 0, fontSize: '28px' },
  subtitle: { color: '#64748b', margin: '4px 0 0', fontSize: '14px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
  tab: { padding: '10px 20px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
  activeTab: { backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', borderColor: '#4ade80' },

  // Chat styles
  chatLayout: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' },
  chatContainer: { backgroundColor: '#1e293b', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '600px', overflow: 'hidden' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  userMsgRow: { display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'flex-end' },
  assistantMsgRow: { display: 'flex', justifyContent: 'flex-start', gap: '10px', alignItems: 'flex-end' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 },
  userAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 },
  userBubble: { backgroundColor: '#4ade80', color: '#0f172a', padding: '10px 16px', borderRadius: '16px 16px 4px 16px', maxWidth: '75%', fontSize: '14px', lineHeight: '1.5', fontWeight: 500 },
  assistantBubble: { backgroundColor: '#0f172a', color: '#e2e8f0', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', maxWidth: '75%', fontSize: '14px', lineHeight: '1.6' },
  typingBubble: { backgroundColor: '#0f172a', padding: '12px 20px', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '4px', alignItems: 'center' },
  dot: { color: '#64748b', fontSize: '18px', animation: 'pulse 1s infinite' },
  chatInputRow: { display: 'flex', gap: '8px', padding: '16px', borderTop: '1px solid #0f172a' },
  chatInput: { flex: 1, padding: '12px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9', fontSize: '14px', outline: 'none' },
  sendBtn: { padding: '12px 18px', backgroundColor: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '18px', cursor: 'pointer' },

  regenBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(74,222,128,0.08)', borderTop: '1px solid rgba(74,222,128,0.2)' },
  regenText: { color: '#94a3b8', fontSize: '13px', flex: 1 },
  regenBtn: { padding: '8px 16px', backgroundColor: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  miniPlanBox: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  miniPlanItem: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  miniMacros: { display: 'flex', gap: '10px', fontSize: '13px', fontWeight: 600 },
  miniWorkouts: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  miniDay: { backgroundColor: '#0f172a', borderRadius: '6px', padding: '4px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' },
  viewPlanBtn: { padding: '6px 12px', backgroundColor: 'transparent', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', textAlign: 'center', marginTop: '2px' },
  quickPanel: { display: 'flex', flexDirection: 'column', gap: '16px' },
  quickTitle: { color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 },
  quickList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  quickBtn: { padding: '10px 14px', backgroundColor: '#1e293b', color: '#cbd5e1', border: '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', textAlign: 'left', lineHeight: '1.4', transition: 'all 0.2s' },
  tipsBox: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '16px' },
  tipsTitle: { color: '#94a3b8', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' },
  tipsList: { paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', color: '#64748b', fontSize: '13px' },

  // Plan styles
  defaultBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', padding: '16px 20px', backgroundColor: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  defaultBannerLeft: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, flexWrap: 'wrap' },
  defaultBadge: { backgroundColor: '#1e293b', color: '#38bdf8', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, border: '1px solid rgba(56,189,248,0.3)', whiteSpace: 'nowrap' },
  defaultBannerText: { color: '#94a3b8', fontSize: '14px' },
  personalizeBtn: { padding: '10px 20px', backgroundColor: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
  generateBtn: { padding: '12px 24px', backgroundColor: '#4ade80', color: '#0f172a', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', cursor: 'pointer' },
  refreshBtn: { padding: '12px 20px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' },
  exportDivider: { width: '1px', height: '28px', backgroundColor: '#334155', margin: '0 4px' },
  exportBtn: { padding: '8px 14px', backgroundColor: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' },
  copyToast: { color: '#4ade80', fontSize: '13px', fontWeight: 600 },
  error: { backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' },
  warningBox: { backgroundColor: 'rgba(251,146,60,0.1)', border: '1px solid #fb923c', color: '#fdba74', padding: '14px 18px', borderRadius: '10px', marginBottom: '20px' },
  warningItem: { marginTop: '4px', fontSize: '14px' },
  metaBar: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  cachedBadge: { backgroundColor: '#1e293b', color: '#94a3b8', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', border: '1px solid #334155' },
  freshBadge: { backgroundColor: 'rgba(74,222,128,0.1)', color: '#4ade80', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', border: '1px solid #4ade80' },
  metaText: { color: '#475569', fontSize: '12px' },
  loadingCard: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '60px', textAlign: 'center', marginBottom: '20px' },
  loadingSpinner: { fontSize: '48px', marginBottom: '16px' },
  loadingText: { color: '#f1f5f9', fontSize: '18px', fontWeight: 600 },
  loadingSubtext: { color: '#64748b', fontSize: '14px', marginTop: '8px' },
  section: { marginBottom: '32px' },
  sectionTitle: { color: '#f1f5f9', fontSize: '20px', marginBottom: '16px' },
  subTitle: { color: '#94a3b8', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px', marginBottom: '12px' },
  insightGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' },
  insightCard: { backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' },
  insightNum: { backgroundColor: '#38bdf8', color: '#0f172a', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 },
  insightText: { color: '#cbd5e1', fontSize: '14px', lineHeight: '1.5' },
  weekGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' },
  dayCard: { backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px', textAlign: 'center' },
  dayLabel: { color: '#38bdf8', fontWeight: 700, fontSize: '13px', marginBottom: '6px' },
  dayWorkout: { color: '#f1f5f9', fontSize: '13px', marginBottom: '6px', lineHeight: '1.4' },
  dayMeta: { color: '#64748b', fontSize: '11px' },
  rationaleBox: { backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px 18px', marginTop: '12px', fontSize: '14px', lineHeight: '1.6' },
  exerciseList: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', alignItems: 'center' },
  exerciseTag: { backgroundColor: '#0f172a', color: '#a78bfa', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', border: '1px solid #312e81' },
  nutritionLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  nutritionLeft: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '20px' },
  calorieTarget: { textAlign: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #0f172a' },
  calorieNum: { color: '#f1f5f9', fontSize: '42px', fontWeight: 700 },
  calorieLabel: { color: '#64748b', fontSize: '13px' },
  pieWrapper: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '10px' },
  mealGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' },
  mealCard: { backgroundColor: '#1e293b', borderRadius: '10px', padding: '14px' },
  mealName: { color: '#38bdf8', fontWeight: 600, fontSize: '13px', marginBottom: '4px' },
  mealExample: { color: '#cbd5e1', fontSize: '13px', marginBottom: '6px' },
  mealCal: { color: '#fb923c', fontSize: '12px' },
  foodLists: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  foodList: { paddingLeft: '16px', margin: 0 },
  emptyState: { backgroundColor: '#1e293b', borderRadius: '16px', padding: '60px 40px', textAlign: 'center', marginTop: '20px' },
  emptyIcon: { fontSize: '64px', marginBottom: '16px' },
  emptyTitle: { color: '#f1f5f9', fontSize: '22px', marginBottom: '12px' },
  emptyText: { color: '#64748b', fontSize: '15px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' },
};
