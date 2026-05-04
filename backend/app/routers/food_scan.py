from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pydantic import BaseModel
import anthropic
import base64
import json

from ..config import settings
from ..database import SessionDep
from ..limiter import limiter
from ..services.ai_errors import call_claude, parse_ai_json
from .auth import CurrentUser

router = APIRouter(prefix="/food-scan", tags=["food-scan"])

SYSTEM_PROMPT = """You are a nutrition expert that analyzes food images. Given a photo of food, provide a detailed nutritional analysis.

You MUST respond with ONLY valid JSON (no markdown, no code blocks) in this exact structure:
{
  "food_name": "Name of the dish/food",
  "description": "Brief description of what you see",
  "estimated_calories": 500,
  "macros": {
    "protein_g": 30,
    "carbs_g": 45,
    "fat_g": 18,
    "fiber_g": 5
  },
  "portion_size": "Estimated portion (e.g. '1 bowl, ~350g')",
  "meal_quality_score": 7,
  "meal_quality_label": "Good",
  "breakdown": [
    {"item": "Grilled chicken breast", "calories": 250, "protein_g": 35},
    {"item": "Brown rice", "calories": 180, "protein_g": 4}
  ],
  "healthier_swaps": [
    {"current": "White rice", "swap": "Cauliflower rice or quinoa", "calories_saved": 80},
    {"current": "Fried preparation", "swap": "Grilled or baked", "calories_saved": 120}
  ],
  "positives": ["Good protein source", "Contains vegetables"],
  "improvements": ["Could add more fiber", "Watch sodium content"],
  "vitamins_minerals": ["Iron", "Vitamin B12", "Potassium"]
}

RULES:
- meal_quality_score is 1-10 (1=very unhealthy, 10=extremely nutritious)
- meal_quality_label: "Poor" (1-3), "Fair" (4-5), "Good" (6-7), "Great" (8-9), "Excellent" (10)
- Be realistic with calorie and macro estimates based on typical portion sizes
- Always suggest 2-3 healthier swaps with estimated calories saved
- If you cannot identify the food clearly, still provide your best estimate and note uncertainty in the description
- breakdown should list each visible component of the meal separately
"""


@router.post("/analyze")
@limiter.limit("10/minute")
async def analyze_food_image(
    request: Request,
    current_user: CurrentUser,
    session: SessionDep,
    file: UploadFile = File(...),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")

    image_data = await file.read()
    if len(image_data) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="Image must be under 10MB")

    base64_image = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = file.content_type

    ai_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    result_text = call_claude(
        ai_client,
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {"type": "base64", "media_type": media_type, "data": base64_image},
                    },
                    {
                        "type": "text",
                        "text": "Analyze this food image. Estimate the calories, macros, meal quality, and suggest healthier swaps.",
                    },
                ],
            }
        ],
    )
    return {"analysis": parse_ai_json(result_text)}


class CorrectionRequest(BaseModel):
    correction: str  # e.g. "That's lamb, not beef" or "It also has rice on the side"
    original_analysis: dict  # the previous analysis result


@router.post("/correct")
@limiter.limit("10/minute")
def correct_analysis(
    request: Request,
    body: CorrectionRequest,
    current_user: CurrentUser,
    session: SessionDep,
):
    ai_client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    result_text = call_claude(
        ai_client,
        model="claude-haiku-4-5-20251001",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": "Here is a food image analysis result:\n\n"
                + json.dumps(body.original_analysis, indent=2),
            },
            {"role": "assistant", "content": json.dumps(body.original_analysis)},
            {
                "role": "user",
                "content": f"The user has corrected your analysis: \"{body.correction}\"\n\n"
                "Please re-analyze with this correction. Update the food name, calories, macros, "
                "breakdown, healthier swaps, and meal quality score accordingly. "
                "Return the full updated JSON response.",
            },
        ],
    )
    return {"analysis": parse_ai_json(result_text)}
