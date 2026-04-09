from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class AIRecommendation(SQLModel, table=True):
    __tablename__ = "ai_recommendations"
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    recommendation_type: str  # 'workout' | 'nutrition' | 'full'
    content: str  # JSON string of the Claude response
    created_at: datetime = Field(default_factory=datetime.utcnow)
