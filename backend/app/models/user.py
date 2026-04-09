from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    name: str
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    gender: Optional[str] = None  # 'male' | 'female' | 'other'
    health_conditions: Optional[str] = None  # JSON string: '["diabetes"]'
    dietary_restrictions: Optional[str] = None  # JSON string: '["vegetarian"]'
    fitness_goal: Optional[str] = None  # 'weight_loss' | 'muscle_gain' | 'endurance' | 'general_wellness'
    activity_level: Optional[str] = None  # 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active'


class User(UserBase, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class UserCreate(SQLModel):
    email: str
    name: str
    password: str


class UserPublic(UserBase):
    id: int
    created_at: datetime


class UserUpdate(SQLModel):
    name: Optional[str] = None
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    gender: Optional[str] = None
    health_conditions: Optional[str] = None
    dietary_restrictions: Optional[str] = None
    fitness_goal: Optional[str] = None
    activity_level: Optional[str] = None
