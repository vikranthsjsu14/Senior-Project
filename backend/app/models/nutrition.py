from sqlmodel import SQLModel, Field
from typing import Optional
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
    meal_type: str
    food_name: str
    calories: float
    protein_g: Optional[float] = None
    carbs_g: Optional[float] = None
    fat_g: Optional[float] = None


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
