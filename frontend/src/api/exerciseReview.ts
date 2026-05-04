import client from './client';

export interface FormIssue {
  issue: string;
  severity: 'minor' | 'moderate' | 'major';
  timestamp_seconds?: number;
  fix: string;
}

export interface ExerciseAnalysis {
  exercise: string;
  rep_count: number;
  overall_score: number;
  overall_label: string;
  summary: string;
  positives: string[];
  form_issues: FormIssue[];
  key_cues: string[];
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const analyzeVideo = async (file: File): Promise<ExerciseAnalysis> => {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post<{ analysis: ExerciseAnalysis }>(
    '/exercise-review/analyze-video',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 }
  );
  return res.data.analysis;
};

export const transcribeAudio = async (blob: Blob): Promise<string> => {
  const form = new FormData();
  form.append('file', blob, 'recording.webm');
  const res = await client.post<{ transcript: string }>(
    '/exercise-review/transcribe',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
  );
  return res.data.transcript;
};

export const chatAboutExercise = async (
  analysis: ExerciseAnalysis,
  history: ChatTurn[],
  message: string
): Promise<string> => {
  const res = await client.post<{ reply: string }>('/exercise-review/chat', {
    analysis,
    history,
    message,
  });
  return res.data.reply;
};
