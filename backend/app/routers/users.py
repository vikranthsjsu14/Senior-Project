from fastapi import APIRouter
from ..database import SessionDep
from ..models.user import User, UserPublic, UserUpdate
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
