from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, timedelta
import json
import anthropic
from sqlmodel import select

from ..database import SessionDep
from ..config import settings
from ..models.user import User
from ..models.health_metrics import DailyMetrics, SleepLog
from ..models.activity import Activity
from ..models.goals import Goal
from ..models.nutrition import NutritionLog
from .auth import CurrentUser

router = APIRouter(prefix="/chat", tags=["chat"])

SYSTEM_PROMPT = """You are a friendly, expert personal health coach and certified nutritionist named HealthAI Coach.
You have access to the user's real health data provided below. Use it to give personalized, evidence-based advice.

RULES:
- Be conversational, warm, and encouraging.
- Reference the user's actual data when giving advice (e.g. "I see you've been averaging 6,200 steps — let's push for 8,000").
- If the user asks about exercise with health conditions, always recommend consulting a doctor first.
- Keep responses concise (2-4 paragraphs max) unless the user asks for detailed plans.
- Use simple language, not medical jargon.
- If the user asks something unrelated to health/fitness, politely redirect.
- You can use bullet points and short lists when helpful.

USER PROFILE:
{user_profile}

RECENT HEALTH DATA (last 7 days):
{health_data}

RECENT ACTIVITIES:
{activities}

ACTIVE GOALS:
{goals}
"""


def _build_user_context(user: User, session) -> str:
    today = date.today()
    week_ago = today - timedelta(days=7)

    # Profile
    profile_parts = [f"Name: {user.name}"]
    if user.age:
        profile_parts.append(f"Age: {user.age}")
    if user.weight_kg:
        profile_parts.append(f"Weight: {user.weight_kg} kg")
    if user.height_cm:
        profile_parts.append(f"Height: {user.height_cm} cm")
    if user.gender:
        profile_parts.append(f"Gender: {user.gender}")
    if user.fitness_goal:
        profile_parts.append(f"Fitness Goal: {user.fitness_goal.replace('_', ' ')}")
    if user.activity_level:
        profile_parts.append(f"Activity Level: {user.activity_level.replace('_', ' ')}")
    if user.health_conditions:
        profile_parts.append(f"Health Conditions: {user.health_conditions}")
    if user.dietary_restrictions:
        profile_parts.append(f"Dietary Restrictions: {user.dietary_restrictions}")
    user_profile = "\n".join(profile_parts)

    # Metrics
    metrics = session.exec(
        select(DailyMetrics)
        .where(DailyMetrics.user_id == user.id)
        .where(DailyMetrics.date >= week_ago)
        .order_by(DailyMetrics.date)
    ).all()

    sleep = session.exec(
        select(SleepLog)
        .where(SleepLog.user_id == user.id)
        .where(SleepLog.date >= week_ago)
        .order_by(SleepLog.date)
    ).all()

    if metrics:
        avg_steps = round(sum(m.steps for m in metrics) / len(metrics))
        avg_cal_burn = round(sum(m.calories_burned for m in metrics) / len(metrics))
        avg_water = round(sum(m.water_intake_ml for m in metrics) / len(metrics))
        avg_active = round(sum(m.active_minutes for m in metrics) / len(metrics))
        health_data = (
            f"Avg Steps: {avg_steps:,}/day\n"
            f"Avg Calories Burned: {avg_cal_burn} kcal/day\n"
            f"Avg Water: {avg_water} ml/day\n"
            f"Avg Active Minutes: {avg_active} min/day\n"
            f"Data points: {len(metrics)} days"
        )
    else:
        health_data = "No health data logged yet."

    if sleep:
        avg_sleep = round(sum(s.duration_hours for s in sleep) / len(sleep), 1)
        health_data += f"\nAvg Sleep: {avg_sleep} hours/night"

    # Activities
    recent_activities = session.exec(
        select(Activity)
        .where(Activity.user_id == user.id)
        .order_by(Activity.date.desc())
        .limit(5)
    ).all()

    if recent_activities:
        act_lines = []
        for a in recent_activities:
            cal = f", {a.calories_burned} kcal" if a.calories_burned else ""
            act_lines.append(f"- {a.date}: {a.name} ({a.type}), {a.duration_minutes} min{cal}")
        activities = "\n".join(act_lines)
    else:
        activities = "No activities logged yet."

    # Goals
    active_goals = session.exec(
        select(Goal)
        .where(Goal.user_id == user.id)
        .where(Goal.is_completed == False)
    ).all()

    if active_goals:
        goal_lines = []
        for g in active_goals:
            pct = round((g.current_value / g.target_value) * 100, 1) if g.target_value > 0 else 0
            goal_lines.append(f"- {g.description or g.type}: {g.current_value}/{g.target_value} {g.unit} ({pct}%)")
        goals = "\n".join(goal_lines)
    else:
        goals = "No active goals set."

    return SYSTEM_PROMPT.format(
        user_profile=user_profile,
        health_data=health_data,
        activities=activities,
        goals=goals,
    )


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


@router.post("")
def chat(body: ChatRequest, current_user: CurrentUser, session: SessionDep):
    system_prompt = _build_user_context(current_user, session)

    # Convert to Anthropic format
    api_messages = [{"role": m.role, "content": m.content} for m in body.messages]

    ai_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    response = ai_client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=system_prompt,
        messages=api_messages,
    )

    reply = response.content[0].text
    return {"reply": reply}
