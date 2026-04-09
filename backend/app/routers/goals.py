from fastapi import APIRouter, HTTPException
from sqlmodel import select
from typing import List

from ..database import SessionDep
from ..models.goals import Goal, GoalCreate, GoalUpdate, GoalPublic
from .auth import CurrentUser

router = APIRouter(prefix="/goals", tags=["goals"])


def _to_public(goal: Goal) -> GoalPublic:
    data = goal.model_dump()
    if goal.target_value > 0:
        data["progress_percent"] = min(100.0, round((goal.current_value / goal.target_value) * 100, 1))
    else:
        data["progress_percent"] = 0.0
    return GoalPublic(**data)


@router.get("", response_model=List[GoalPublic])
def get_goals(current_user: CurrentUser, session: SessionDep, include_completed: bool = False):
    query = select(Goal).where(Goal.user_id == current_user.id)
    if not include_completed:
        query = query.where(Goal.is_completed == False)
    goals = session.exec(query.order_by(Goal.created_at.desc())).all()
    return [_to_public(g) for g in goals]


@router.post("", response_model=GoalPublic, status_code=201)
def create_goal(data: GoalCreate, current_user: CurrentUser, session: SessionDep):
    goal = Goal(**data.model_dump(), user_id=current_user.id)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return _to_public(goal)


@router.patch("/{goal_id}", response_model=GoalPublic)
def update_goal(goal_id: int, updates: GoalUpdate, current_user: CurrentUser, session: SessionDep):
    goal = session.get(Goal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(goal, key, value)
    session.add(goal)
    session.commit()
    session.refresh(goal)
    return _to_public(goal)


@router.delete("/{goal_id}", status_code=204)
def delete_goal(goal_id: int, current_user: CurrentUser, session: SessionDep):
    goal = session.get(Goal, goal_id)
    if not goal or goal.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Goal not found")
    session.delete(goal)
    session.commit()
