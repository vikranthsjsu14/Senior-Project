import json
import os
import tempfile
from typing import List, Literal

from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field

from ..database import SessionDep
from ..limiter import limiter
from ..services.gemini_service import analyze_video, chat_about_analysis, transcribe_audio
from .auth import CurrentUser

router = APIRouter(prefix="/exercise-review", tags=["exercise-review"])

MAX_VIDEO_BYTES = 100 * 1024 * 1024  # 100 MB
MAX_AUDIO_BYTES = 15 * 1024 * 1024  # 15 MB


def _save_temp(upload: UploadFile, data: bytes) -> str:
    suffix = os.path.splitext(upload.filename or "")[1] or ""
    fd, path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        f.write(data)
    return path


@router.post("/analyze-video")
@limiter.limit("4/minute")
async def analyze_video_endpoint(
    request: Request,
    current_user: CurrentUser,
    session: SessionDep,
    file: UploadFile = File(...),
):
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video (MP4, MOV, WebM).")

    data = await file.read()
    if len(data) > MAX_VIDEO_BYTES:
        raise HTTPException(status_code=400, detail="Video must be under 100 MB. Try a shorter clip.")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    path = _save_temp(file, data)
    try:
        analysis = analyze_video(path, file.content_type)
    finally:
        try:
            os.remove(path)
        except OSError:
            pass
    return {"analysis": analysis}


@router.post("/transcribe")
@limiter.limit("20/minute")
async def transcribe_audio_endpoint(
    request: Request,
    current_user: CurrentUser,
    session: SessionDep,
    file: UploadFile = File(...),
):
    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be an audio clip.")

    data = await file.read()
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=400, detail="Audio must be under 15 MB.")
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    path = _save_temp(file, data)
    try:
        transcript = transcribe_audio(path, file.content_type)
    finally:
        try:
            os.remove(path)
        except OSError:
            pass
    return {"transcript": transcript}


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ExerciseChatRequest(BaseModel):
    analysis: dict
    history: List[ChatTurn] = Field(default_factory=list, max_length=50)
    message: str = Field(min_length=1, max_length=2000)


@router.post("/chat")
@limiter.limit("20/minute")
def chat_endpoint(
    request: Request,
    body: ExerciseChatRequest,
    current_user: CurrentUser,
    session: SessionDep,
):
    history = [{"role": t.role, "content": t.content} for t in body.history]
    reply = chat_about_analysis(body.analysis, history, body.message)
    return {"reply": reply}
