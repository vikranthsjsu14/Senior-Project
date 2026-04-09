from fastapi import APIRouter, HTTPException
from sqlmodel import select
from typing import List
from datetime import date

from ..database import SessionDep
from ..models.nutrition import NutritionLog, NutritionLogCreate, NutritionLogPublic
from .auth import CurrentUser

router = APIRouter(prefix="/nutrition", tags=["nutrition"])


@router.get("", response_model=List[NutritionLogPublic])
def get_nutrition(
    current_user: CurrentUser,
    session: SessionDep,
    log_date: date = None,
):
    query = select(NutritionLog).where(NutritionLog.user_id == current_user.id)
    if log_date:
        query = query.where(NutritionLog.date == log_date)
    logs = session.exec(query.order_by(NutritionLog.date.desc(), NutritionLog.created_at)).all()
    return logs


@router.post("", response_model=NutritionLogPublic, status_code=201)
def log_nutrition(data: NutritionLogCreate, current_user: CurrentUser, session: SessionDep):
    log = NutritionLog(**data.model_dump(), user_id=current_user.id)
    session.add(log)
    session.commit()
    session.refresh(log)
    return log


@router.delete("/{log_id}", status_code=204)
def delete_nutrition(log_id: int, current_user: CurrentUser, session: SessionDep):
    log = session.get(NutritionLog, log_id)
    if not log or log.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Nutrition log not found")
    session.delete(log)
    session.commit()
