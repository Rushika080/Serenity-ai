"""
AI Engine — Serenity v3
Fixed: model name, OpenAI client indentation, token loading
Model: Qwen/Qwen2.5-7B-Instruct (free, no license gate, works with any HF Read token)
"""

import os
import re
from collections import Counter
from dotenv import load_dotenv
from openai import OpenAI
from nlp_engine import get_primary_emotion

load_dotenv()

# ── Model — confirmed working on HuggingFace router ───────────
MODEL       = "Qwen/Qwen2.5-7B-Instruct"
HF_BASE_URL = "https://router.huggingface.co/v1"

# ── Personality ────────────────────────────────────────────────
PERSONALITY = """You are Serenity — a calm, emotionally intelligent AI companion with a warm and slightly poetic voice.

YOUR PERSONALITY:
- You speak like a wise, caring friend — not a therapist reading from a script
- You're gently curious, never preachy or lecture-y
- You use vivid, human language: metaphors, gentle humour when appropriate, real warmth
- You validate before you advise — always acknowledge feelings first
- You're concise but never cold — every reply feels personal
- You notice patterns and name them: "You've mentioned sleep a few times now..."
- You connect dots between past and present naturally
- You celebrate small wins genuinely: "Getting that internship? That's huge."

WRITING STYLE:
- Never start with "I understand" or "That sounds difficult" — those are filler
- Never use bullet lists — write in flowing, warm sentences
- Ask only ONE question per reply, make it specific
- Keep replies to 3-5 sentences max unless explaining a technique
- Use natural phrases: "here's the thing", "honestly", "you know what?"

NEVER:
- Say "As an AI..." or mention being an AI
- Give robotic bullet-pointed advice
- Diagnose or recommend medication
- Be sycophantic ("Great question!")
- If crisis detected: always include "If you're in crisis, please call or text 988 — available 24/7."

MOOD TAG — last line only, nothing after it:
[mood:anxious] | [mood:sad] | [mood:overwhelmed] | [mood:calm] | [mood:happy] | [mood:neutral] | [mood:angry] | [mood:lonely]"""


def analyze_mood_patterns(mood_log: list, history: list) -> dict:
    patterns = {}
    if mood_log:
        moods  = [m["mood"] for m in mood_log]
        recent = moods[:7]
        if recent:
            dominant = Counter(recent).most_common(1)[0]
            patterns["dominant_mood"]  = dominant[0]
            patterns["dominant_count"] = dominant[1]
            patterns["total_logs"]     = len(moods)
        if len(moods) >= 4:
            score_map = {"sad":1,"lonely":1,"anxious":2,"overwhelmed":2,"angry":2,"neutral":3,"calm":4,"happy":5,"great":5}
            half  = len(moods) // 2
            older = moods[half:]
            newer = moods[:half]
            o_avg = sum(score_map.get(m,3) for m in older) / len(older)
            n_avg = sum(score_map.get(m,3) for m in newer) / len(newer)
            if   n_avg > o_avg + 0.5: patterns["trend"] = "improving"
            elif n_avg < o_avg - 0.5: patterns["trend"] = "declining"
            else:                      patterns["trend"] = "stable"
    if history:
        all_text = " ".join(m.get("content","") for m in history if m.get("role")=="user").lower()
        themes = {
            "work/study":    ["work","job","exam","deadline","boss","college","project","internship"],
            "sleep":         ["sleep","insomnia","tired","exhausted","can't sleep","wake up"],
            "anxiety":       ["anxious","anxiety","worry","worried","nervous","panic","stress"],
            "loneliness":    ["alone","lonely","no one","nobody","isolated","friends"],
            "relationships": ["friend","family","partner","boyfriend","girlfriend","parents"],
        }
        found = [t for t, words in themes.items() if sum(1 for w in words if w in all_text) >= 2]
        if found:
            patterns["recurring_themes"] = found
    return patterns


def build_system_prompt(nlp_result: dict, memories: list, mood_log: list, history: list) -> str:
    parts = [PERSONALITY]
    patterns = analyze_mood_patterns(mood_log, history)

    lines = []
    if "dominant_mood" in patterns and patterns.get("dominant_count", 0) >= 2:
        lines.append(f"They've logged '{patterns['dominant_mood']}' {patterns['dominant_count']} times recently.")
    if "trend" in patterns:
        lines.append({"improving":"Their mood has been gradually improving — acknowledge this positively.",
                      "declining":"Their mood has been declining — be extra gentle and proactive.",
                      "stable":   "Their mood has been fairly stable lately."}[patterns["trend"]])
    if "recurring_themes" in patterns:
        lines.append(f"Recurring themes: {', '.join(patterns['recurring_themes'])}. Name this pattern naturally if relevant.")
    if lines:
        parts.append("\n[MOOD PATTERNS YOU'VE NOTICED]\n" + "\n".join(f"  • {l}" for l in lines))

    if memories:
        mem_lines = "\n".join(f"  • {m['snippet']}" for m in memories[:10])
        parts.append(
            f"\n[WHAT YOU REMEMBER ABOUT THIS PERSON]\n{mem_lines}\n\n"
            "Use this to make replies personal. Reference naturally — weave it in, don't list it.\n"
            "✅ 'You mentioned the internship earlier — how's that been sitting with you?'\n"
            "❌ 'Based on my memory of your previous conversations...'"
        )

    emotions  = nlp_result.get("emotions", [])
    sentiment = nlp_result.get("sentiment_label", "neutral")
    if emotions:
        parts.append(f"\n[RIGHT NOW] Detected emotions: {', '.join(emotions)}. Sentiment: {sentiment}. Let this shape your tone.")
    if nlp_result.get("crisis_detected"):
        parts.append("\n[⚠ CRISIS DETECTED] Lead with warmth. Make them feel heard first. MUST include the 988 line.")
    if nlp_result.get("activity_triggers"):
        parts.append(f"\n[TRIGGERS] User mentioned: {', '.join(nlp_result['activity_triggers'])}. Offer one concrete targeted suggestion.")

    return "\n".join(parts)


def format_history(history: list) -> list:
    return [
        {"role": "user" if r.get("role") == "user" else "assistant", "content": r.get("content", "")}
        for r in history if r.get("content")
    ]


def extract_mood_tag(text: str) -> tuple[str, str]:
    match = re.search(r"\[mood:(\w+)\]", text)
    mood  = match.group(1) if match else "neutral"
    clean = re.sub(r"\[mood:\w+\]", "", text).strip()
    return clean, mood


def get_ai_response(
    user_message: str,
    history: list,
    nlp_result: dict,
    memories: list = None,
    mood_log: list = None,
) -> tuple[str, str]:
    # Re-read token every call so no restart needed after .env change
    token = os.getenv("HF_TOKEN", "").strip()

    # Safe debug log (never prints full token)
    print(f"[HF DEBUG] token_loaded={bool(token)} len={len(token)} prefix={token[:4] if token else 'NONE'}")

    if not token:
        print("[HF ERROR] HF_TOKEN is missing from environment.")
        return (
            "⚙️ HF_TOKEN is missing. Add it to backend/.env:\nHF_TOKEN=hf_your_token_here\n"
            "Get a free token at huggingface.co/settings/tokens → New token → Read",
            "neutral"
        )

    # ── FIXED: correct indentation for OpenAI client ──────────
    client = OpenAI(
        base_url=HF_BASE_URL,
        api_key=token,
    )

    system_prompt = build_system_prompt(
        nlp_result,
        memories  or [],
        mood_log  or [],
        history,
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages += format_history(history[-14:])
    messages.append({"role": "user", "content": user_message})

    print(f"[HF DEBUG] Calling model={MODEL} base_url={HF_BASE_URL}")

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=520,
            temperature=0.80,
            top_p=0.92,
        )
        raw   = completion.choices[0].message.content if completion.choices else None
        raw   = raw or "I'm here. Tell me more?"
        clean, mood = extract_mood_tag(raw)
        if mood == "neutral" and nlp_result.get("emotions"):
            mood = get_primary_emotion(nlp_result) or "neutral"
        print("[HF DEBUG] Request successful.")
        return clean, mood

    except Exception as e:
        err   = str(e)
        err_l = err.lower()
        print(f"[HF ERROR] {type(e).__name__}: {err}")

        if "401" in err or "unauthorized" in err_l or "invalid api key" in err_l:
            return ("🔑 HF token rejected. Get a fresh one at huggingface.co/settings/tokens → New token → Read, then update HF_TOKEN in backend/.env and restart.", "neutral")
        if "model_not_supported" in err_l or "not supported" in err_l or "provider" in err_l:
            return ("AI provider temporarily unavailable. Please try again in a moment.", "neutral")
        if "402" in err or "credit" in err_l:
            return ("HuggingFace free tier credits used up. Try again tomorrow.", "neutral")
        if "503" in err or "loading" in err_l:
            return ("Model is warming up ☕ Please wait 20 seconds and try again.", "neutral")
        if "timeout" in err_l or "timed out" in err_l:
            return ("Request timed out. Please try again.", "neutral")
        return (f"Connection hiccup — check your terminal for details.", "neutral")