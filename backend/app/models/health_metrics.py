from sqlmodel import SQLModel, Field
from typing import Optional
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
    steps: int = 0
    calories_burned: float = 0
    calories_consumed: float = 0
    water_intake_ml: int = 0
    active_minutes: int = 0


class DailyMetricsUpdate(SQLModel):
    steps: Optional[int] = None
    calories_burned: Optional[float] = None
    calories_consumed: Optional[float] = None
    water_intake_ml: Optional[int] = None
    active_minutes: Optional[int] = None


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
    duration_hours: float
    quality_score: Optional[int] = None


class HeartRateLog(SQLModel, table=True):
    __tablename__ = "heart_rate_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    bpm: int
    context: Optional[str] = None  # 'resting' | 'active' | 'peak'


class HeartRateLogCreate(SQLModel):
    timestamp: Optional[datetime] = None
    bpm: int
    context: Optional[str] = None
