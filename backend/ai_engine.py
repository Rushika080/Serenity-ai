"""
AI Engine — HuggingFace Router (OpenAI-compatible)
Key improvement: memories are now INJECTED into the system prompt
so the AI actually uses them when responding, not just stored.
"""

import re
import os
from openai import OpenAI
from nlp_engine import get_primary_emotion

MODEL = "Qwen/Qwen2.5-7B-Instruct"

BASE_SYSTEM = """You are Serenity, a compassionate AI mental health companion. Your role is to:
- Listen deeply and validate emotions without judgment
- Offer calming suggestions and grounding techniques (breathing, 5-4-3-2-1, body scan)
- Suggest evidence-based wellness activities tailored to the user's emotional state
- Be warm, concise, and human — never robotic or clinical
- Always end with a small actionable step or a gentle open question
- Keep replies to 3-5 sentences unless explaining an exercise
- Reference what you know about the user naturally — don't list it, weave it in

IMPORTANT RULES:
- Never diagnose or prescribe medication
- If crisis signals are detected, always include: "If you're in crisis, please call or text 988 (Suicide & Crisis Lifeline) — available 24/7."
- Tag your response mood on the very last line only — choose one:
  [mood:anxious] | [mood:sad] | [mood:overwhelmed] | [mood:calm] | [mood:happy] | [mood:neutral] | [mood:angry] | [mood:lonely]"""


def build_system_prompt(nlp_result: dict, memories: list) -> str:
    parts = [BASE_SYSTEM]

    # ── Inject memories so AI actually uses them ──────────────
    if memories:
        mem_lines = "\n".join(f"  - {m['snippet']}" for m in memories[:8])
        parts.append(
            f"\n[WHAT YOU KNOW ABOUT THIS USER]\n"
            f"From previous conversations, you remember:\n{mem_lines}\n"
            f"Use this context naturally. Connect their past and present — "
            f"e.g. if they mentioned work stress before and now mention sleep problems, link them."
        )

    # ── NLP context ───────────────────────────────────────────
    emotions = nlp_result.get("emotions", [])
    if emotions:
        parts.append(
            f"\n[CURRENT EMOTIONAL STATE] Detected: {', '.join(emotions)}. "
            f"Sentiment: {nlp_result.get('sentiment_label', 'neutral')}."
        )

    if nlp_result.get("crisis_detected"):
        parts.append(
            "\n[CRISIS ALERT] User may be in acute distress. "
            "Respond with warmth and urgency. You MUST include the 988 crisis line."
        )

    if nlp_result.get("activity_triggers"):
        parts.append(
            f"\n[ACTIVITY TRIGGERS] User mentioned: {', '.join(nlp_result['activity_triggers'])}. "
            f"Suggest targeted coping activities for these specific issues."
        )

    return "\n".join(parts)


def format_history(history: list) -> list:
    return [
        {"role": "user" if r["role"] == "user" else "assistant", "content": r["content"]}
        for r in history
    ]


def extract_mood_tag(text: str) -> tuple[str, str]:
    match = re.search(r'\[mood:(\w+)\]', text)
    mood  = match.group(1) if match else "neutral"
    clean = re.sub(r'\[mood:\w+\]', '', text).strip()
    return clean, mood


def get_ai_response(
    user_message: str,
    history: list,
    nlp_result: dict,
    memories: list = None,
) -> tuple[str, str]:
    """
    Returns (ai_reply_text, detected_mood).
    Memories are injected into the system prompt so the AI uses them.
    """
    token = os.environ.get("HF_TOKEN", "").strip()

    if not token:
        return (
            "⚙️ HF_TOKEN is missing in backend/.env\n\n"
            "Steps:\n1. Go to huggingface.co/settings/tokens\n"
            "2. New token → Role: Read → Create\n"
            "3. Add HF_TOKEN=hf_... to backend/.env\n"
            "4. Restart the server",
            "neutral"
        )

    client = OpenAI(
        base_url="https://router.huggingface.co/v1",
        api_key=token,
    )

    system_prompt = build_system_prompt(nlp_result, memories or [])
    messages = [{"role": "system", "content": system_prompt}]
    messages += format_history(history[-14:])  # last 14 turns
    messages.append({"role": "user", "content": user_message})

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.75,
        )
        raw   = completion.choices[0].message.content or "I'm here for you. Could you tell me more?"
        clean, mood = extract_mood_tag(raw)

        if mood == "neutral" and nlp_result.get("emotions"):
            mood = get_primary_emotion(nlp_result) or "neutral"

        return clean, mood

    except Exception as e:
        err   = str(e)
        err_l = err.lower()
        print(f"[ai_engine ERROR] {err}")

        if "401" in err or "unauthorized" in err_l or "invalid" in err_l:
            return (
                "🔑 HF token rejected (401).\n\n"
                "Fix:\n1. huggingface.co/settings/tokens → New token → Read\n"
                "2. Update HF_TOKEN in backend/.env\n"
                "3. Restart: uvicorn main:app --reload --port 8000",
                "neutral"
            )
        if "402" in err or "credit" in err_l:
            return ("HuggingFace free credits used up. Try again tomorrow.", "neutral")
        if "503" in err or "loading" in err_l:
            return ("Model is warming up ☕ Please wait 20 seconds and try again.", "neutral")

        return (f"Connection error. Check your terminal.\nDetail: {err[:150]}", "neutral")