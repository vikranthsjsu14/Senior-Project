from sqlmodel import SQLModel, Field
from typing import Optional, Literal
from datetime import date as Date, datetime


class NutritionLog(SQLModel, table=True):
    __tablename__ = "nutrition_logs"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    date: Date = Field(index=True)
    meal_type: str  # 'breakfast' | 'lunch' | 'dinner' | 'snack'
    food_name: str
    calories: float
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class NutritionLogCreate(SQLModel):
    date: Date
    meal_type: Literal["breakfast", "lunch", "dinner", "snack"]
    food_name: str = Field(min_length=1, max_length=200)
    calories: float = Field(ge=0, le=10_000)
    protein_g: Optional[float] = Field(default=None, ge=0, le=1_000)
    carbs_g: Optional[float] = Field(default=None, ge=0, le=1_000)
    fat_g: Optional[float] = Field(default=None, ge=0, le=1_000)


class NutritionLogPublic(SQLModel):
    id: int
    date: Date
    meal_type: str
    food_name: str
    calories: float
    protein_g: Optional[float]
    carbs_g: Optional[float]
    fat_g: Optional[float]
    created_at: datetime
