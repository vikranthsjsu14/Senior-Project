from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date as Date, datetime


class Goal(SQLModel, table=True):
    __tablename__ = "goals"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    type: str  # 'steps_daily' | 'weight_target' | 'calories_weekly' | 'sleep_hours' | 'workout_frequency'
    description: Optional[str] = None
    target_value: float
    current_value: float = Field(default=0)
    unit: str  # 'steps' | 'kg' | 'kcal' | 'hours' | 'sessions'
    deadline: Optional[Date] = None
    is_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class GoalCreate(SQLModel):
    type: str
    description: Optional[str] = None
    target_value: float
    unit: str
    deadline: Optional[Date] = None


class GoalUpdate(SQLModel):
    current_value: Optional[float] = None
    is_completed: Optional[bool] = None
    description: Optional[str] = None


class GoalPublic(SQLModel):
    id: int
    type: str
    description: Optional[str]
    target_value: float
    current_value: float
    unit: str
    deadline: Optional[Date]
    is_completed: bool
    created_at: datetime
    progress_percent: Optional[float] = None
