from fastapi import APIRouter, HTTPException
from sqlmodel import select
from typing import List

from ..database import SessionDep
from ..models.activity import Activity, ActivityCreate, ActivityPublic
from .auth import CurrentUser

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=List[ActivityPublic])
def get_activities(current_user: CurrentUser, session: SessionDep, limit: int = 20):
    activities = session.exec(
        select(Activity)
        .where(Activity.user_id == current_user.id)
        .order_by(Activity.date.desc())
        .limit(limit)
    ).all()
    return activities


@router.post("", response_model=ActivityPublic, status_code=201)
def log_activity(data: ActivityCreate, current_user: CurrentUser, session: SessionDep):
    activity = Activity(**data.model_dump(), user_id=current_user.id)
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return activity


@router.get("/{activity_id}", response_model=ActivityPublic)
def get_activity(activity_id: int, current_user: CurrentUser, session: SessionDep):
    activity = session.get(Activity, activity_id)
    if not activity or activity.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Activity not found")
    return activity


@router.delete("/{activity_id}", status_code=204)
def delete_activity(activity_id: int, current_user: CurrentUser, session: SessionDep):
    activity = session.get(Activity, activity_id)
    if not activity or activity.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Activity not found")
    session.delete(activity)
    session.commit()
