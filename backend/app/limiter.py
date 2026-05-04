from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from .config import settings


def _user_or_ip(request: Request) -> str:
    """Rate-limit per authenticated user when possible, else per IP."""
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id = payload.get("sub")
            if user_id is not None:
                return f"user:{user_id}"
        except JWTError:
            pass
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=_user_or_ip)
