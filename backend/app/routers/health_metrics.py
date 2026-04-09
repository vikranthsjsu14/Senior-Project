from fastapi import APIRouter, HTTPException
from sqlmodel import select
from typing import List, Optional
from datetime import date, timedelta

from ..database import SessionDep
from ..models.health_metrics import (
    DailyMetrics, DailyMetricsCreate, DailyMetricsUpdate,
    SleepLog, SleepLogCreate,
    HeartRateLog, HeartRateLogCreate,
)
from .auth import CurrentUser

router = APIRouter(prefix="/metrics", tags=["metrics"])


# --- Daily Metrics ---

@router.get("/daily", response_model=List[DailyMetrics])
def get_daily_metrics(
    current_user: CurrentUser,
    session: SessionDep,
    days: int = 7,
):
    cutoff = date.today() - timedelta(days=days)
    metrics = session.exec(
        select(DailyMetrics)
        .where(DailyMetrics.user_id == current_user.id)
        .where(DailyMetrics.date >= cutoff)
        .order_by(DailyMetrics.date)
    ).all()
    return metrics


@router.get("/daily/today", response_model=Optional[DailyMetrics])
def get_today_metrics(current_user: CurrentUser, session: SessionDep):
    today = date.today()
    metrics = session.exec(
        select(DailyMetrics)
        .where(DailyMetrics.user_id == current_user.id)
        .where(DailyMetrics.date == today)
    ).first()
    return metrics


@router.post("/daily", response_model=DailyMetrics)
def log_daily_metrics(data: DailyMetricsCreate, current_user: CurrentUser, session: SessionDep):
    existing = session.exec(
        select(DailyMetrics)
        .where(DailyMetrics.user_id == current_user.id)
        .where(DailyMetrics.date == data.date)
    ).first()

    if existing:
        # Update existing record
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(existing, key, value)
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    metrics = DailyMetrics(**data.model_dump(), user_id=current_user.id)
    session.add(metrics)
    session.commit()
    session.refresh(metrics)
    return metrics


@router.patch("/daily/{metrics_id}", response_model=DailyMetrics)
def update_daily_metrics(
    metrics_id: int,
    updates: DailyMetricsUpdate,
    current_user: CurrentUser,
    session: SessionDep,
):
    metrics = session.get(DailyMetrics, metrics_id)
    if not metrics or metrics.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Metrics not found")
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(metrics, key, value)
    session.add(metrics)
    session.commit()
    session.refresh(metrics)
    return metrics


# --- Sleep Logs ---

@router.get("/sleep", response_model=List[SleepLog])
def get_sleep_logs(current_user: CurrentUser, session: SessionDep, days: int = 7):
    cutoff = date.today() - timedelta(days=days)
    logs = session.exec(
        select(SleepLog)
        .where(SleepLog.user_id == current_user.id)
        .where(SleepLog.date >= cutoff)
        .order_by(SleepLog.date)
    ).all()
    return logs


@router.post("/sleep", response_model=SleepLog)
def log_sleep(data: SleepLogCreate, current_user: CurrentUser, session: SessionDep):
    log = SleepLog(**data.model_dump(), user_id=current_user.id)
    session.add(log)
    session.commit()
    session.refresh(log)
    return log


# --- Heart Rate ---

@router.get("/heart-rate", response_model=List[HeartRateLog])
def get_heart_rate(current_user: CurrentUser, session: SessionDep, limit: int = 50):
    logs = session.exec(
        select(HeartRateLog)
        .where(HeartRateLog.user_id == current_user.id)
        .order_by(HeartRateLog.timestamp.desc())
        .limit(limit)
    ).all()
    return logs[::-1]


@router.post("/heart-rate", response_model=HeartRateLog)
def log_heart_rate(data: HeartRateLogCreate, current_user: CurrentUser, session: SessionDep):
    from datetime import datetime
    log = HeartRateLog(
        user_id=current_user.id,
        bpm=data.bpm,
        context=data.context,
        timestamp=data.timestamp or datetime.utcnow(),
    )
    session.add(log)
    session.commit()
    session.refresh(log)
    return log
