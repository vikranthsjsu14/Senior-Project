from fastapi import APIRouter
from sqlmodel import select, func
from datetime import date, timedelta
from typing import List, Optional

from ..database import SessionDep
from ..models.health_metrics import DailyMetrics, SleepLog
from ..models.activity import Activity
from ..models.goals import Goal
from .auth import CurrentUser

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _compute_streak(metrics_by_date: dict, target_steps: int) -> int:
    """Count consecutive days ending today where steps >= target_steps."""
    if target_steps <= 0:
        return 0
    streak = 0
    cursor = date.today()
    while True:
        m = metrics_by_date.get(cursor)
        if m is None or m.steps < target_steps:
            break
        streak += 1
        cursor -= timedelta(days=1)
    return streak


@router.get("/summary")
def get_dashboard_summary(current_user: CurrentUser, session: SessionDep):
    today = date.today()
    week_ago = today - timedelta(days=7)

    # Today's metrics
    today_metrics = session.exec(
        select(DailyMetrics)
        .where(DailyMetrics.user_id == current_user.id)
        .where(DailyMetrics.date == today)
    ).first()

    # Last 7 days of daily metrics (for charts)
    weekly_metrics = session.exec(
        select(DailyMetrics)
        .where(DailyMetrics.user_id == current_user.id)
        .where(DailyMetrics.date >= week_ago)
        .order_by(DailyMetrics.date)
    ).all()

    # Last 7 days of sleep
    sleep_logs = session.exec(
        select(SleepLog)
        .where(SleepLog.user_id == current_user.id)
        .where(SleepLog.date >= week_ago)
        .order_by(SleepLog.date)
    ).all()

    # Recent activities (last 5)
    recent_activities = session.exec(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(Activity.date.desc())
        .limit(5)
    ).all()

    # Active goals
    active_goals = session.exec(
        select(Goal)
        .where(Goal.user_id == current_user.id)
        .where(Goal.is_completed == False)
    ).all()

    # Calculate weekly averages
    avg_steps = 0
    avg_calories_burned = 0
    avg_sleep = 0

    if weekly_metrics:
        avg_steps = round(sum(m.steps for m in weekly_metrics) / len(weekly_metrics))
        avg_calories_burned = round(sum(m.calories_burned for m in weekly_metrics) / len(weekly_metrics))

    if sleep_logs:
        avg_sleep = round(sum(s.duration_hours for s in sleep_logs) / len(sleep_logs), 1)

    # Streak: consecutive days ending today hitting the daily-steps goal
    step_goal = next((g for g in active_goals if g.type == "steps_daily"), None)
    streak_days = 0
    streak_target = 0
    if step_goal:
        streak_target = int(step_goal.target_value)
        streak_window = session.exec(
            select(DailyMetrics)
            .where(DailyMetrics.user_id == current_user.id)
            .where(DailyMetrics.date >= today - timedelta(days=90))
        ).all()
        metrics_by_date = {m.date: m for m in streak_window}
        streak_days = _compute_streak(metrics_by_date, streak_target)

    return {
        "today": today_metrics,
        "weekly_metrics": [
            {
                "date": str(m.date),
                "steps": m.steps,
                "calories_burned": m.calories_burned,
                "calories_consumed": m.calories_consumed,
                "water_intake_ml": m.water_intake_ml,
                "active_minutes": m.active_minutes,
            }
            for m in weekly_metrics
        ],
        "sleep_logs": [
            {
                "date": str(s.date),
                "duration_hours": s.duration_hours,
                "quality_score": s.quality_score,
            }
            for s in sleep_logs
        ],
        "recent_activities": [
            {
                "id": a.id,
                "name": a.name,
                "type": a.type,
                "duration_minutes": a.duration_minutes,
                "calories_burned": a.calories_burned,
                "date": str(a.date),
            }
            for a in recent_activities
        ],
        "active_goals": [
            {
                "id": g.id,
                "type": g.type,
                "description": g.description,
                "target_value": g.target_value,
                "current_value": g.current_value,
                "unit": g.unit,
                "progress_percent": min(100.0, round((g.current_value / g.target_value) * 100, 1)) if g.target_value > 0 else 0,
            }
            for g in active_goals
        ],
        "weekly_averages": {
            "avg_steps": avg_steps,
            "avg_calories_burned": avg_calories_burned,
            "avg_sleep_hours": avg_sleep,
        },
        "streak": {
            "days": streak_days,
            "target_steps": streak_target,
        },
    }
