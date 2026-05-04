import json
import logging
from typing import Any

import anthropic
from fastapi import HTTPException

logger = logging.getLogger(__name__)


def call_claude(client: anthropic.Anthropic, **kwargs) -> str:
    """Call Claude and return the assistant's text, translating SDK errors to HTTPExceptions."""
    try:
        response = client.messages.create(**kwargs)
    except anthropic.AuthenticationError:
        logger.exception("Anthropic auth failed — check API key")
        raise HTTPException(status_code=500, detail="AI service is misconfigured. Please contact support.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="AI service is busy. Please try again in a moment.")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=503, detail="Cannot reach AI service. Please check your connection and try again.")
    except anthropic.APITimeoutError:
        raise HTTPException(status_code=504, detail="AI service timed out. Please try again.")
    except anthropic.BadRequestError as e:
        raise HTTPException(status_code=400, detail=f"AI service rejected the request: {e.message}")
    except anthropic.APIStatusError as e:
        if e.status_code and 500 <= e.status_code < 600:
            raise HTTPException(status_code=503, detail="AI service is temporarily unavailable. Please try again.")
        raise HTTPException(status_code=502, detail="AI service returned an unexpected error.")

    if not response.content or not getattr(response.content[0], "text", None):
        raise HTTPException(status_code=502, detail="AI service returned an empty response. Please try again.")
    return response.content[0].text.strip()


def parse_ai_json(text: str) -> Any:
    """Parse Claude's response as JSON, tolerating markdown code fences."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        first_newline = cleaned.find("\n")
        if first_newline != -1:
            cleaned = cleaned[first_newline + 1 :]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("AI returned non-JSON response: %s", text[:500])
        raise HTTPException(status_code=502, detail="AI returned an unexpected response. Please try again.")
