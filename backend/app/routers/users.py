from fastapi import APIRouter, Response
from sqlmodel import select, delete

from ..database import SessionDep
from ..models.user import User, UserPublic, UserUpdate
from ..models.health_metrics import DailyMetrics, SleepLog, HeartRateLog
from ..models.activity import Activity
from ..models.nutrition import NutritionLog
from ..models.goals import Goal
from ..models.ai_recommendation import AIRecommendation
from .auth import CurrentUser

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
def get_me(current_user: CurrentUser):
    return current_user


@router.patch("/me", response_model=UserPublic)
def update_me(updates: UserUpdate, current_user: CurrentUser, session: SessionDep):
    user_data = updates.model_dump(exclude_unset=True)
    for key, value in user_data.items():
        setattr(current_user, key, value)
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.get("/me/export")
def export_my_data(current_user: CurrentUser, session: SessionDep):
    """Return a full JSON dump of everything the user has stored."""
    uid = current_user.id

    def _dump(query):
        return [m.model_dump(mode="json") for m in session.exec(query).all()]

    return {
        "profile": UserPublic.model_validate(current_user).model_dump(mode="json"),
        "daily_metrics": _dump(select(DailyMetrics).where(DailyMetrics.user_id == uid)),
        "sleep_logs": _dump(select(SleepLog).where(SleepLog.user_id == uid)),
        "heart_rate_logs": _dump(select(HeartRateLog).where(HeartRateLog.user_id == uid)),
        "activities": _dump(select(Activity).where(Activity.user_id == uid)),
        "nutrition_logs": _dump(select(NutritionLog).where(NutritionLog.user_id == uid)),
        "goals": _dump(select(Goal).where(Goal.user_id == uid)),
        "ai_recommendations": _dump(select(AIRecommendation).where(AIRecommendation.user_id == uid)),
    }


@router.delete("/me", status_code=204)
def delete_my_account(current_user: CurrentUser, session: SessionDep):
    """Delete the user and every record tied to their user_id."""
    uid = current_user.id
    for model in (
        DailyMetrics, SleepLog, HeartRateLog, Activity, NutritionLog, Goal, AIRecommendation,
    ):
        session.exec(delete(model).where(model.user_id == uid))
    session.delete(current_user)
    session.commit()
    return Response(status_code=204)
