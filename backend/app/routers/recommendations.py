from fastapi import APIRouter, HTTPException
from sqlmodel import select
from typing import List
from datetime import datetime, timedelta
import json

from ..database import SessionDep
from ..models.ai_recommendation import AIRecommendation
from ..services.ai_service import get_recommendations
from .auth import CurrentUser

router = APIRouter(prefix="/ai", tags=["ai"])


class RecommendationRequest:
    pass


from pydantic import BaseModel


class RecommendationRequestBody(BaseModel):
    recommendation_type: str = "full"  # 'workout' | 'nutrition' | 'full'
    force_refresh: bool = False


@router.post("/recommendations")
def create_recommendations(
    body: RecommendationRequestBody,
    current_user: CurrentUser,
    session: SessionDep,
):
    if not body.force_refresh:
        # Check cache — return if within last 24 hours
        cutoff = datetime.utcnow() - timedelta(hours=24)
        cached = session.exec(
            select(AIRecommendation)
            .where(AIRecommendation.user_id == current_user.id)
            .where(AIRecommendation.recommendation_type == body.recommendation_type)
            .where(AIRecommendation.created_at >= cutoff)
            .order_by(AIRecommendation.created_at.desc())
        ).first()

        if cached:
            return {"data": json.loads(cached.content), "cached": True, "generated_at": cached.created_at}

    if not current_user.age and not current_user.fitness_goal:
        raise HTTPException(
            status_code=400,
            detail="Please complete your profile (age, fitness goal) before generating recommendations.",
        )

    try:
        result = get_recommendations(current_user.id, body.recommendation_type, session)
        return {"data": result, "cached": False, "generated_at": datetime.utcnow()}
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned invalid response. Please try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service error: {str(e)}")


@router.get("/recommendations")
def get_cached_recommendations(current_user: CurrentUser, session: SessionDep, limit: int = 5):
    recs = session.exec(
        select(AIRecommendation)
        .where(AIRecommendation.user_id == current_user.id)
        .order_by(AIRecommendation.created_at.desc())
        .limit(limit)
    ).all()
    return [
        {
            "id": r.id,
            "type": r.recommendation_type,
            "data": json.loads(r.content),
            "generated_at": r.created_at,
        }
        for r in recs
    ]
