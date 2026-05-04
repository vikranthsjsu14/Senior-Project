// User
export interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  gender?: string;
  health_conditions?: string;
  dietary_restrictions?: string;
  fitness_goal?: string;
  activity_level?: string;
  created_at: string;
}

export interface UserUpdate {
  name?: string;
  age?: number;
  weight_kg?: number;
  height_cm?: number;
  gender?: string;
  health_conditions?: string;
  dietary_restrictions?: string;
  fitness_goal?: string;
  activity_level?: string;
}

// Daily Metrics
export interface DailyMetrics {
  id: number;
  user_id: number;
  date: string;
  steps: number;
  calories_burned: number;
  calories_consumed: number;
  water_intake_ml: number;
  active_minutes: number;
}

export interface DailyMetricsCreate {
  date: string;
  steps?: number;
  calories_burned?: number;
  calories_consumed?: number;
  water_intake_ml?: number;
  active_minutes?: number;
}

// Sleep
export interface SleepLog {
  id: number;
  user_id: number;
  date: string;
  sleep_start: string;
  sleep_end: string;
  duration_hours: number;
  quality_score?: number;
}

export interface SleepLogCreate {
  date: string;
  sleep_start: string;
  sleep_end: string;
  duration_hours: number;
  quality_score?: number;
}

// Activity
export interface Activity {
  id: number;
  name: string;
  type: string;
  duration_minutes: number;
  calories_burned?: number;
  distance_km?: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface ActivityCreate {
  name: string;
  type: string;
  duration_minutes: number;
  calories_burned?: number;
  distance_km?: number;
  date: string;
  notes?: string;
}

// Nutrition
export interface NutritionLog {
  id: number;
  date: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  created_at: string;
}

export interface NutritionLogCreate {
  date: string;
  meal_type: string;
  food_name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

// Goals
export interface Goal {
  id: number;
  type: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  is_completed: boolean;
  created_at: string;
  progress_percent?: number;
}

export interface GoalCreate {
  type: string;
  description?: string;
  target_value: number;
  unit: string;
  deadline?: string;
}

// Dashboard
export interface DashboardSummary {
  today: DailyMetrics | null;
  weekly_metrics: {
    date: string;
    steps: number;
    calories_burned: number;
    calories_consumed: number;
    water_intake_ml: number;
    active_minutes: number;
  }[];
  sleep_logs: { date: string; duration_hours: number; quality_score?: number }[];
  recent_activities: {
    id: number;
    name: string;
    type: string;
    duration_minutes: number;
    calories_burned?: number;
    date: string;
  }[];
  active_goals: {
    id: number;
    type: string;
    description?: string;
    target_value: number;
    current_value: number;
    unit: string;
    progress_percent: number;
  }[];
  weekly_averages: {
    avg_steps: number;
    avg_calories_burned: number;
    avg_sleep_hours: number;
  };
  streak: {
    days: number;
    target_steps: number;
  };
}

// AI Recommendations
export interface WorkoutDay {
  day: string;
  workout: string;
  duration_minutes: number;
  intensity: string;
}

export interface MacroTargets {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface MealSuggestion {
  meal: string;
  example: string;
  calories: number;
}

export interface AIRecommendationData {
  workout_plan: {
    weekly_schedule: WorkoutDay[];
    key_exercises: string[];
    rationale: string;
  };
  nutrition_advice: {
    daily_calorie_target: number;
    macro_targets: MacroTargets;
    meal_suggestions: MealSuggestion[];
    foods_to_focus_on: string[];
    foods_to_limit: string[];
    rationale: string;
  };
  insights: string[];
  warnings: string[];
}

export interface AIRecommendationResponse {
  data: AIRecommendationData;
  cached: boolean;
  generated_at: string;
}
