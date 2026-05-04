import json
import anthropic
from datetime import date, timedelta
from fastapi import HTTPException
from sqlmodel import select

from ..config import settings
from ..models.user import User
from ..models.health_metrics import DailyMetrics, SleepLog
from ..models.activity import Activity
from ..models.goals import Goal
from ..models.nutrition import NutritionLog
from ..models.ai_recommendation import AIRecommendation
from .ai_errors import call_claude, parse_ai_json

SYSTEM_PROMPT = """You are an expert personal health coach and certified nutritionist with 15 years of experience.
You provide evidence-based, personalized health and fitness recommendations based on real user data.

IMPORTANT SAFETY RULES:
- Always recommend consulting a doctor before starting new exercise regimens if the user has health conditions.
- Never recommend fewer than 1200 kcal/day for women or 1500 kcal/day for men.
- Flag any health conditions that require medical supervision.
- Keep recommendations realistic and achievable.

You MUST respond with ONLY valid JSON (no markdown, no code blocks, no extra text) in this exact structure:
{
  "workout_plan": {
    "weekly_schedule": [
      {"day": "Monday", "workout": "...", "duration_minutes": 30, "intensity": "moderate"}
    ],
    "key_exercises": ["exercise1", "exercise2"],
    "rationale": "Why this plan suits this user"
  },
  "nutrition_advice": {
    "daily_calorie_target": 2000,
    "macro_targets": {
      "protein_g": 150,
      "carbs_g": 200,
      "fat_g": 65
    },
    "meal_suggestions": [
      {"meal": "Breakfast", "example": "...", "calories": 400}
    ],
    "foods_to_focus_on": ["food1", "food2"],
    "foods_to_limit": ["food1", "food2"],
    "rationale": "Why this nutrition plan suits this user"
  },
  "insights": [
    "Insight about their current health data trend",
    "Another observation"
  ],
  "warnings": []
}"""


def _format_activities(activities: list) -> str:
    if not activities:
        return "No recent activities logged."
    lines = []
    for a in activities:
        cal_str = f", {a.calories_burned} kcal burned" if a.calories_burned else ""
        lines.append(f"  - {a.date}: {a.name} ({a.type}), {a.duration_minutes} min{cal_str}")
    return "\n".join(lines)


def _format_goals(goals: list) -> str:
    if not goals:
        return "No active goals set."
    lines = []
    for g in goals:
        pct = round((g.current_value / g.target_value) * 100, 1) if g.target_value > 0 else 0
        lines.append(f"  - {g.type}: {g.current_value}/{g.target_value} {g.unit} ({pct}% complete)")
    return "\n".join(lines)


def get_recommendations(user_id: int, recommendation_type: str, session) -> dict:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = date.today()
    week_ago = today - timedelta(days=7)

    # Gather context data
    weekly_metrics = session.exec(
        select(DailyMetrics)
        .where(DailyMetrics.user_id == user_id)
        .where(DailyMetrics.date >= week_ago)
    ).all()

    sleep_logs = session.exec(
        select(SleepLog)
        .where(SleepLog.user_id == user_id)
        .where(SleepLog.date >= week_ago)
    ).all()

    recent_activities = session.exec(
        select(Activity)
        .where(Activity.user_id == user_id)
        .order_by(Activity.date.desc())
        .limit(10)
    ).all()

    active_goals = session.exec(
        select(Goal)
        .where(Goal.user_id == user_id)
        .where(Goal.is_completed == False)
    ).all()

    recent_nutrition = session.exec(
        select(NutritionLog)
        .where(NutritionLog.user_id == user_id)
        .where(NutritionLog.date >= (today - timedelta(days=3)))
        .order_by(NutritionLog.date.desc())
        .limit(20)
    ).all()

    # Calculate averages
    avg_steps = round(sum(m.steps for m in weekly_metrics) / len(weekly_metrics)) if weekly_metrics else 0
    avg_calories_burned = round(sum(m.calories_burned for m in weekly_metrics) / len(weekly_metrics)) if weekly_metrics else 0
    avg_calories_consumed = round(sum(m.calories_consumed for m in weekly_metrics) / len(weekly_metrics)) if weekly_metrics else 0
    avg_water_ml = round(sum(m.water_intake_ml for m in weekly_metrics) / len(weekly_metrics)) if weekly_metrics else 0
    avg_active_min = round(sum(m.active_minutes for m in weekly_metrics) / len(weekly_metrics)) if weekly_metrics else 0
    avg_sleep = round(sum(s.duration_hours for s in sleep_logs) / len(sleep_logs), 1) if sleep_logs else 0

    # Recent nutrition summary
    total_protein = sum(n.protein_g or 0 for n in recent_nutrition)
    total_carbs = sum(n.carbs_g or 0 for n in recent_nutrition)
    total_fat = sum(n.fat_g or 0 for n in recent_nutrition)
    nutrition_days = len(set(n.date for n in recent_nutrition)) or 1

    user_message = f"""Please create a personalized health plan for this user:

USER PROFILE:
- Name: {user.name}
- Age: {user.age or 'Not specified'} years
- Weight: {user.weight_kg or 'Not specified'} kg
- Height: {user.height_cm or 'Not specified'} cm
- Gender: {user.gender or 'Not specified'}
- Fitness Goal: {user.fitness_goal or 'general_wellness'}
- Activity Level: {user.activity_level or 'moderately_active'}
- Health Conditions: {user.health_conditions or 'None reported'}
- Dietary Restrictions: {user.dietary_restrictions or 'None'}

LAST 7 DAYS HEALTH DATA:
- Average Daily Steps: {avg_steps:,}
- Average Active Minutes: {avg_active_min} min/day
- Average Sleep: {avg_sleep} hours/night
- Average Calories Burned: {avg_calories_burned} kcal/day
- Average Calories Consumed: {avg_calories_consumed} kcal/day
- Average Water Intake: {avg_water_ml} ml/day
- Data points collected: {len(weekly_metrics)} days

RECENT NUTRITION (last 3 days avg):
- Avg Protein: {round(total_protein/nutrition_days, 1)}g/day
- Avg Carbs: {round(total_carbs/nutrition_days, 1)}g/day
- Avg Fat: {round(total_fat/nutrition_days, 1)}g/day

RECENT WORKOUTS (last 10):
{_format_activities(recent_activities)}

ACTIVE GOALS:
{_format_goals(active_goals)}

Recommendation type requested: {recommendation_type}
Please provide the full JSON response now."""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response_text = call_claude(
        client,
        model="claude-haiku-4-5-20251001",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )
    recommendation_data = parse_ai_json(response_text)

    # Cache in database
    cached = AIRecommendation(
        user_id=user_id,
        recommendation_type=recommendation_type,
        content=json.dumps(recommendation_data),
    )
    session.add(cached)
    session.commit()

    return recommendation_data
