"""Gemini SDK helpers for video analysis, audio transcription, and chat follow-up.

Errors from the SDK are translated into HTTPExceptions so router code stays clean.
"""
import logging
import time
from pathlib import Path
from typing import Any

import google.generativeai as genai
from fastapi import HTTPException

from ..config import settings
from .ai_errors import parse_ai_json

logger = logging.getLogger(__name__)

VIDEO_ANALYSIS_PROMPT = """You are a certified personal trainer and exercise physiologist with 15 years of coaching experience. The user has uploaded a short video of themselves performing an exercise and wants honest, specific feedback on their form.

You MUST respond with ONLY valid JSON (no markdown, no code blocks) in this exact structure:
{
  "exercise": "Detected exercise name (e.g. 'Barbell Back Squat', 'Push-up', 'Deadlift')",
  "rep_count": 5,
  "overall_score": 7,
  "overall_label": "Good",
  "summary": "1-2 sentence high-level take on their form",
  "positives": [
    "Good depth on each rep",
    "Controlled tempo on the descent"
  ],
  "form_issues": [
    {
      "issue": "Knees collapse inward at the bottom of the squat",
      "severity": "moderate",
      "timestamp_seconds": 4,
      "fix": "Actively push your knees out as you descend — imagine spreading the floor with your feet"
    }
  ],
  "key_cues": [
    "Brace your core before each rep",
    "Drive through your heels"
  ]
}

RULES:
- overall_score is 1-10
- overall_label: "Needs Work" (1-3), "Fair" (4-5), "Good" (6-7), "Great" (8-9), "Excellent" (10)
- severity: "minor" | "moderate" | "major"
- timestamp_seconds is when the issue is most visible — omit if you cannot estimate
- Only flag form issues you can actually see — do NOT invent generic concerns
- If you cannot identify the exercise, say so in "summary" and give general full-body movement principles
- If you see anything that suggests injury risk or pre-existing pain, recommend they consult a coach or physiotherapist in the summary
- Keep cues actionable and specific — no vague advice like "be careful" or "use proper form"
"""


def _client():
    if not settings.google_api_key:
        raise HTTPException(
            status_code=500,
            detail="Google API key is not configured. Add GOOGLE_API_KEY to your .env file.",
        )
    genai.configure(api_key=settings.google_api_key)


def _upload_and_wait(path: str, mime_type: str, timeout_seconds: int = 90) -> Any:
    """Upload a file via the Gemini File API and wait until it finishes processing."""
    try:
        uploaded = genai.upload_file(path=path, mime_type=mime_type)
    except Exception as e:
        logger.exception("Gemini file upload failed")
        raise HTTPException(status_code=502, detail=f"Could not upload file to AI service: {e}")

    deadline = time.time() + timeout_seconds
    while uploaded.state.name == "PROCESSING":
        if time.time() > deadline:
            raise HTTPException(status_code=504, detail="AI service took too long to process the file. Try a shorter clip.")
        time.sleep(1.5)
        uploaded = genai.get_file(uploaded.name)

    if uploaded.state.name == "FAILED":
        raise HTTPException(status_code=502, detail="AI service failed to process the uploaded file.")
    return uploaded


def _generate(model_name: str, parts: list, response_mime_type: str | None = None) -> str:
    try:
        model = genai.GenerativeModel(model_name)
        kwargs = {}
        if response_mime_type:
            kwargs["generation_config"] = {"response_mime_type": response_mime_type}
        response = model.generate_content(parts, **kwargs)
    except Exception as e:
        logger.exception("Gemini generation failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

    if not response.candidates or not response.text:
        raise HTTPException(status_code=502, detail="AI service returned an empty response.")
    return response.text.strip()


def analyze_video(path: str, mime_type: str) -> dict:
    """Send a video file to Gemini and return the structured form-review JSON."""
    _client()
    uploaded = _upload_and_wait(path, mime_type)
    text = _generate(
        settings.gemini_video_model,
        [uploaded, VIDEO_ANALYSIS_PROMPT],
        response_mime_type="application/json",
    )
    return parse_ai_json(text)


def transcribe_audio(path: str, mime_type: str) -> str:
    """Transcribe a short audio clip to plain text."""
    _client()
    uploaded = _upload_and_wait(path, mime_type, timeout_seconds=45)
    return _generate(
        settings.gemini_audio_model,
        [uploaded, "Transcribe this audio clip verbatim. Return only the transcription, no commentary."],
    )


def chat_about_analysis(prior_analysis: dict, history: list[dict], user_message: str) -> str:
    """Continue a conversation about a previously-analyzed video.

    history is a list of {role: 'user'|'model', content: str} dicts.
    """
    _client()
    system = (
        "You are a friendly personal trainer continuing a conversation about a video the user uploaded. "
        "Use the analysis below as ground truth — refer to specific issues, cues, and reps from it. "
        "Be conversational, specific, and encouraging. Keep replies under 4 sentences unless the user asks for detail.\n\n"
        f"PRIOR FORM ANALYSIS (JSON):\n{prior_analysis}\n"
    )
    contents = [{"role": "user", "parts": [system]}, {"role": "model", "parts": ["Got it — ready when you are."]}]
    for m in history:
        role = "user" if m.get("role") == "user" else "model"
        contents.append({"role": role, "parts": [m.get("content", "")]})
    contents.append({"role": "user", "parts": [user_message]})

    return _generate(settings.gemini_chat_model, contents)
