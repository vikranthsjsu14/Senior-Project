from fastapi import APIRouter
from datetime import date, datetime, timedelta
import random

from ..database import SessionDep
from ..models.health_metrics import DailyMetrics, SleepLog, HeartRateLog
from .auth import CurrentUser

router = APIRouter(prefix="/wearable", tags=["wearable"])

ACTIVITY_MULTIPLIERS = {
    "sedentary": 0.6,
    "lightly_active": 0.85,
    "moderately_active": 1.0,
    "very_active": 1.3,
}


@router.post("/sync")
def sync_wearable(current_user: CurrentUser, session: SessionDep):
    """Simulate syncing data from a wearable device for the past 7 days."""
    multiplier = ACTIVITY_MULTIPLIERS.get(current_user.activity_level or "moderately_active", 1.0)
    today = date.today()
    synced_days = []

    for days_ago in range(7, 0, -1):
        day = today - timedelta(days=days_ago)

        # Check if already exists
        from sqlmodel import select
        existing = session.exec(
            select(DailyMetrics)
            .where(DailyMetrics.user_id == current_user.id)
            .where(DailyMetrics.date == day)
        ).first()

        if existing:
            continue

        steps = int(random.gauss(8000 * multiplier, 1500))
        steps = max(1000, min(25000, steps))
        calories_burned = int(steps * 0.04 + random.gauss(400 * multiplier, 80))
        active_minutes = int(steps / 100 + random.gauss(20, 10))
        water_ml = int(random.gauss(2000 * multiplier, 300))
        water_ml = max(500, min(4000, water_ml))

        metrics = DailyMetrics(
            user_id=current_user.id,
            date=day,
            steps=steps,
            calories_burned=calories_burned,
            water_intake_ml=water_ml,
            active_minutes=max(0, active_minutes),
        )
        session.add(metrics)

        # Sleep log
        sleep_hours = round(random.gauss(7.2, 0.8), 1)
        sleep_hours = max(4.0, min(10.0, sleep_hours))
        sleep_start = datetime.combine(day, datetime.min.time()).replace(hour=23, minute=random.randint(0, 59))
        sleep_end = sleep_start + timedelta(hours=sleep_hours)
        quality = random.randint(5, 10)

        sleep = SleepLog(
            user_id=current_user.id,
            date=day,
            sleep_start=sleep_start,
            sleep_end=sleep_end,
            duration_hours=sleep_hours,
            quality_score=quality,
        )
        session.add(sleep)

        # A few heart rate readings
        for hr_offset in [8, 12, 17]:
            bpm_base = 65 if hr_offset == 8 else (120 if hr_offset == 12 else 75)
            bpm = int(random.gauss(bpm_base * multiplier, 8))
            bpm = max(45, min(190, bpm))
            context = "resting" if hr_offset == 8 else ("active" if hr_offset == 12 else "resting")
            hr = HeartRateLog(
                user_id=current_user.id,
                timestamp=datetime.combine(day, datetime.min.time()).replace(hour=hr_offset),
                bpm=bpm,
                context=context,
            )
            session.add(hr)

        synced_days.append(str(day))

    session.commit()
    return {"synced_days": synced_days, "message": f"Synced {len(synced_days)} days of wearable data"}
