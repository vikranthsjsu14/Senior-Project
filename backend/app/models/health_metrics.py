from sqlmodel import SQLModel, Field
from typing import Optional, Literal
from datetime import date as Date, datetime


class DailyMetrics(SQLModel, table=True):
    __tablename__ = "daily_metrics"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    date: Date = Field(index=True)
    steps: int = Field(default=0)
    calories_burned: float = Field(default=0)
    calories_consumed: float = Field(default=0)
    water_intake_ml: int = Field(default=0)
    active_minutes: int = Field(default=0)


class DailyMetricsCreate(SQLModel):
    date: Date
    steps: int = Field(default=0, ge=0, le=100_000)
    calories_burned: float = Field(default=0, ge=0, le=20_000)
    calories_consumed: float = Field(default=0, ge=0, le=20_000)
    water_intake_ml: int = Field(default=0, ge=0, le=20_000)
    active_minutes: int = Field(default=0, ge=0, le=1_440)


class DailyMetricsUpdate(SQLModel):
    steps: Optional[int] = Field(default=None, ge=0, le=100_000)
    calories_burned: Optional[float] = Field(default=None, ge=0, le=20_000)
    calories_consumed: Optional[float] = Field(default=None, ge=0, le=20_000)
    water_intake_ml: Optional[int] = Field(default=None, ge=0, le=20_000)
    active_minutes: Optional[int] = Field(default=None, ge=0, le=1_440)


class SleepLog(SQLModel, table=True):
    __tablename__ = "sleep_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    date: Date = Field(index=True)
    sleep_start: datetime
    sleep_end: datetime
    duration_hours: float
    quality_score: Optional[int] = None  # 1-10


class SleepLogCreate(SQLModel):
    date: Date
    sleep_start: datetime
    sleep_end: datetime
    duration_hours: float = Field(ge=0, le=24)
    quality_score: Optional[int] = Field(default=None, ge=1, le=10)


class HeartRateLog(SQLModel, table=True):
    __tablename__ = "heart_rate_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    bpm: int
    context: Optional[str] = None  # 'resting' | 'active' | 'peak'


class HeartRateLogCreate(SQLModel):
    timestamp: Optional[datetime] = None
    bpm: int = Field(ge=30, le=250)
    context: Optional[Literal["resting", "active", "peak"]] = None
