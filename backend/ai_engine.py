
"""
AI Engine — Serenity Personality Layer v2

- Rich, warm, human personality
- Memory-aware responses
- Mood pattern detection
- Hugging Face Inference Providers via OpenAI-compatible API
- Safe Render/local environment diagnostics
"""

import os
import re
from collections import Counter

from dotenv import load_dotenv
from openai import OpenAI

from nlp_engine import get_primary_emotion


# -------------------------------------------------------------------
# Environment
# -------------------------------------------------------------------

# Load backend/.env locally.
# On Render, environment variables are supplied by Render itself.
load_dotenv()

MODEL = "openai/gpt-oss-120b"
HF_BASE_URL = "https://router.huggingface.co/v1"


# -------------------------------------------------------------------
# Core personality
# -------------------------------------------------------------------

PERSONALITY = """You are Serenity — a calm, emotionally intelligent AI companion with a warm and slightly poetic voice.

YOUR PERSONALITY:
- You speak like a wise, caring friend — not a therapist reading from a script
- You're gently curious, never preachy or lecture-y
- You use vivid, human language: metaphors, gentle humour when appropriate, real warmth
- You validate before you advise — always acknowledge feelings first
- You're concise but never cold — every reply feels personal
- You notice patterns and name them out loud
- You connect dots between past and present
- You celebrate small wins genuinely

WRITING STYLE RULES:
- Never start with "I understand" or "That sounds difficult"
- Never use bullet lists in replies — write in flowing, warm sentences
- Use occasional light humour when appropriate
- Ask only ONE question per reply
- Keep replies to 3-5 sentences max unless explaining a technique
- Use natural conversational language

WHAT YOU NEVER DO:
- Never say "As an AI..." or mention being an AI
- Never give robotic bullet-pointed advice
- Never diagnose or recommend medication
- Never be sycophantic

If crisis signals are detected, prioritize immediate safety and encourage the person to contact appropriate emergency/crisis support.

MOOD TAG (last line only, nothing after):
[mood:anxious] | [mood:sad] | [mood:overwhelmed] | [mood:calm] | [mood:happy] | [mood:neutral] | [mood:angry] | [mood:lonely]
"""


# -------------------------------------------------------------------
# Mood / pattern analysis
# -------------------------------------------------------------------

def analyze_mood_patterns(mood_log: list, history: list) -> dict:
    """Extract meaningful patterns from mood history and chat."""
    patterns = {}

    if mood_log:
        moods = [m["mood"] for m in mood_log]
        total = len(moods)

        recent = moods[:7]

        if recent:
            dominant = Counter(recent).most_common(1)[0]
            patterns["dominant_mood"] = dominant[0]
            patterns["dominant_count"] = dominant[1]
            patterns["total_logs"] = total

        if len(moods) >= 4:
            mood_score = {
                "sad": 1,
                "lonely": 1,
                "anxious": 2,
                "overwhelmed": 2,
                "angry": 2,
                "neutral": 3,
                "calm": 4,
                "happy": 5,
                "great": 5,
            }

            older = moods[len(moods) // 2:]
            newer = moods[:len(moods) // 2]

            older_avg = sum(
                mood_score.get(m, 3) for m in older
            ) / len(older)

            newer_avg = sum(
                mood_score.get(m, 3) for m in newer
            ) / len(newer)

            if newer_avg > older_avg + 0.5:
                patterns["trend"] = "improving"
            elif newer_avg < older_avg - 0.5:
                patterns["trend"] = "declining"
            else:
                patterns["trend"] = "stable"

    if history:
        all_text = " ".join(
            m["content"]
            for m in history
            if m.get("role") == "user"
        ).lower()

        theme_keywords = {
            "work/study": [
                "work", "job", "exam", "deadline",
                "boss", "college", "project", "internship"
            ],
            "sleep": [
                "sleep", "insomnia", "tired",
                "exhausted", "can't sleep", "wake up"
            ],
            "anxiety": [
                "anxious", "anxiety", "worry",
                "worried", "nervous", "panic", "stress"
            ],
            "loneliness": [
                "alone", "lonely", "no one",
                "nobody", "isolated", "friends"
            ],
            "relationships": [
                "friend", "family", "partner",
                "boyfriend", "girlfriend", "parents"
            ],
        }

        found_themes = []

        for theme, words in theme_keywords.items():
            hits = sum(1 for word in words if word in all_text)

            if hits >= 2:
                found_themes.append(theme)

        if found_themes:
            patterns["recurring_themes"] = found_themes

    return patterns


# -------------------------------------------------------------------
# System prompt
# -------------------------------------------------------------------

def build_system_prompt(
    nlp_result: dict,
    memories: list,
    mood_log: list,
    history: list,
) -> str:

    parts = [PERSONALITY]

    patterns = analyze_mood_patterns(mood_log, history)

    pattern_lines = []

    if (
        "dominant_mood" in patterns
        and patterns.get("dominant_count", 0) >= 2
    ):
        pattern_lines.append(
            f"They've logged '{patterns['dominant_mood']}' "
            f"{patterns['dominant_count']} times recently."
        )

    if "trend" in patterns:
        trend_msg = {
            "improving":
                "Their mood has been gradually improving — acknowledge this positively.",
            "declining":
                "Their mood has been declining — be extra gentle and proactive.",
            "stable":
                "Their mood has been fairly stable lately.",
        }

        pattern_lines.append(trend_msg[patterns["trend"]])

    if "recurring_themes" in patterns:
        themes = ", ".join(patterns["recurring_themes"])

        pattern_lines.append(
            f"Recurring themes in their conversations: {themes}. "
            "If relevant, name this pattern naturally."
        )

    if pattern_lines:
        parts.append(
            "\n[MOOD PATTERNS YOU'VE NOTICED]\n"
            + "\n".join(f"  • {p}" for p in pattern_lines)
        )

    if memories:
        mem_lines = "\n".join(
            f"  • {m['snippet']}"
            for m in memories[:10]
        )

        parts.append(
            "\n[WHAT YOU REMEMBER ABOUT THIS PERSON]\n"
            f"{mem_lines}\n\n"
            "Use this to make replies personal and specific. "
            "Reference memories naturally and connect past to present."
        )

    emotions = nlp_result.get("emotions", [])
    sentiment = nlp_result.get("sentiment_label", "neutral")

    if emotions:
        parts.append(
            f"\n[RIGHT NOW] Detected emotions: {', '.join(emotions)}. "
            f"Sentiment: {sentiment}. "
            "Let this shape your tone."
        )

    if nlp_result.get("crisis_detected"):
        parts.append(
            "\n[CRISIS DETECTED] "
            "Prioritize immediate safety. "
            "Lead with warmth and encourage appropriate crisis support."
        )

    if nlp_result.get("activity_triggers"):
        triggers = ", ".join(nlp_result["activity_triggers"])

        parts.append(
            f"\n[SPECIFIC ISSUE] They mentioned: {triggers}. "
            "Offer one concrete, targeted suggestion."
        )

    return "\n".join(parts)


# -------------------------------------------------------------------
# Conversation formatting
# -------------------------------------------------------------------

def format_history(history: list) -> list:
    return [
        {
            "role": "user" if r.get("role") == "user" else "assistant",
            "content": r.get("content", ""),
        }
        for r in history
        if r.get("content")
    ]


# -------------------------------------------------------------------
# Mood extraction
# -------------------------------------------------------------------

def extract_mood_tag(text: str) -> tuple[str, str]:
    match = re.search(r"\[mood:(\w+)\]", text)

    mood = match.group(1) if match else "neutral"

    clean = re.sub(
        r"\[mood:\w+\]",
        "",
        text
    ).strip()

    return clean, mood


# -------------------------------------------------------------------
# HF diagnostics
# -------------------------------------------------------------------

def _get_hf_token() -> str:
    """
    Get HF token from environment.

    Local:
        backend/.env

    Render:
        Render Environment Variables
    """
    return os.getenv("HF_TOKEN", "").strip()


def _print_hf_debug(token: str) -> None:
    """
    Safe diagnostics.

    NEVER prints the full token.
    """

    print(
        "[HF DEBUG] token_loaded=",
        bool(token),
        "length=",
        len(token),
        "prefix=",
        token[:3] if token else "NONE",
        "suffix=",
        token[-4:] if token else "NONE",
    )


# -------------------------------------------------------------------
# Main AI response
# -------------------------------------------------------------------

def get_ai_response(
    user_message: str,
    history: list,
    nlp_result: dict,
    memories: list = None,
    mood_log: list = None,
) -> tuple[str, str]:

    token = _get_hf_token()

    # Safe diagnostics for local + Render debugging.
    _print_hf_debug(token)

    if not token:
        print("[HF ERROR] HF_TOKEN is missing.")

        return (
            "Serenity's AI service is temporarily unavailable. "
            "Please try again in a moment.",
            "neutral",
        )

    try:
        client = OpenAI(
            base_url=HF_BASE_URL,
            api_key=token,
            timeout=30.0,
            max_retries=1,
        )

        system_prompt = build_system_prompt(
            nlp_result,
            memories or [],
            mood_log or [],
            history,
        )

        messages = [
            {
                "role": "system",
                "content": system_prompt,
            }
        ]

        messages += format_history(history[-14:])

        messages.append(
            {
                "role": "user",
                "content": user_message,
            }
        )

        print(
            f"[HF DEBUG] Calling model={MODEL} "
            f"base_url={HF_BASE_URL}"
        )

        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=520,
            temperature=0.80,
            top_p=0.92,
        )

        raw = (
            completion.choices[0].message.content
            if completion.choices
            else None
        )

        raw = raw or "I'm here. Tell me more?"

        clean, mood = extract_mood_tag(raw)

        if mood == "neutral" and nlp_result.get("emotions"):
            mood = get_primary_emotion(nlp_result) or "neutral"

        print("[HF DEBUG] Request successful.")

        return clean, mood

    except Exception as e:

        err = str(e)
        err_lower = err.lower()

        # Always log the REAL error in Render.
        print(
            f"[HF ERROR] {type(e).__name__}: {err}"
        )

        # Authentication specifically.
        if (
            "401" in err
            or "unauthorized" in err_lower
            or "invalid api key" in err_lower
        ):
            return (
                "Serenity couldn't authenticate with its AI service "
                "right now. Please try again in a moment.",
                "neutral",
            )

        # Provider / model issue.
        if (
            "model_not_supported" in err_lower
            or "not supported" in err_lower
            or "provider" in err_lower
        ):
            return (
                "Serenity's AI provider is temporarily unavailable. "
                "Please try again shortly.",
                "neutral",
            )

        # Billing / credits.
        if "402" in err or "credit" in err_lower:
            return (
                "Serenity's AI service has temporarily reached its usage limit.",
                "neutral",
            )

        # Provider/model loading.
        if "503" in err or "loading" in err_lower:
            return (
                "The AI model is warming up ☕ "
                "Please wait a moment and try again.",
                "neutral",
            )

        # Timeout.
        if (
            "timeout" in err_lower
            or "timed out" in err_lower
        ):
            return (
                "Serenity's AI service took too long to respond. "
                "Please try again.",
                "neutral",
            )

        # Generic failure.
        return (
            "Serenity's AI service had a connection hiccup. "
            "Please try again in a moment.",
            "neutral",
        )
