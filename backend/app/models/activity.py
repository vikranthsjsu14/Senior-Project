from sqlmodel import SQLModel, Field
from typing import Optional, Literal
from datetime import date as Date, datetime


class Activity(SQLModel, table=True):
    __tablename__ = "activities"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str
    type: str  # 'cardio' | 'strength' | 'flexibility' | 'sports'
    duration_minutes: int
    calories_burned: Optional[float] = None
    distance_km: Optional[float] = None
    date: Date
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ActivityCreate(SQLModel):
    name: str = Field(min_length=1, max_length=100)
    type: Literal["cardio", "strength", "flexibility", "sports"]
    duration_minutes: int = Field(ge=1, le=1_440)
    calories_burned: Optional[float] = Field(default=None, ge=0, le=20_000)
    distance_km: Optional[float] = Field(default=None, ge=0, le=1_000)
    date: Date
    notes: Optional[str] = Field(default=None, max_length=500)


class ActivityPublic(SQLModel):
    id: int
    name: str
    type: str
    duration_minutes: int
    calories_burned: Optional[float]
    distance_km: Optional[float]
    date: Date
    notes: Optional[str]
    created_at: datetime
