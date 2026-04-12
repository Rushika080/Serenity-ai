"""
AI Engine — Serenity Personality Layer v2
- Rich, warm, human personality (never robotic)
- Memory-aware: references past conversations naturally
- Pattern detection: mood trends, recurring themes
- Interesting, specific replies — not generic filler
"""

import re
import os
from collections import Counter
from openai import OpenAI
from nlp_engine import get_primary_emotion

MODEL = "Qwen/Qwen2.5-7B-Instruct"

# ── Core personality ───────────────────────────────────────────
PERSONALITY = """You are Serenity — a calm, emotionally intelligent AI companion with a warm and slightly poetic voice.

YOUR PERSONALITY:
- You speak like a wise, caring friend — not a therapist reading from a script
- You're gently curious, never preachy or lecture-y
- You use vivid, human language: metaphors, gentle humour when appropriate, real warmth
- You validate before you advise — always acknowledge feelings first
- You're concise but never cold — every reply feels personal
- You notice patterns and name them out loud: "You've mentioned sleep a few times now — sounds like your body is trying to tell you something"
- You connect dots between past and present: "Last time you felt like this, you said work was piling up — is that still happening?"
- You celebrate small wins genuinely: "Getting selected for that internship? That's huge. Seriously."

WRITING STYLE RULES:
- Never start with "I understand" or "That sounds difficult" — those are filler
- Never use bullet lists in replies — write in flowing, warm sentences
- Use occasional light humour to ease tension (but read the room — never during crisis)
- Ask only ONE question per reply, and make it specific and curious, not generic
- Keep replies to 3-5 sentences max (unless explaining a technique)
- Use em-dashes, ellipses naturally — like real speech
- Occasionally use "you know what?", "here's the thing", "honestly" to sound human

WHAT YOU NEVER DO:
- Never say "As an AI..." or mention being an AI
- Never give robotic bullet-pointed advice
- Never diagnose or recommend medication
- Never be sycophantic ("Great question!")
- If crisis signals detected: always include "If you're in crisis, please call or text 988 (Suicide & Crisis Lifeline) — they're there 24/7, no judgment."

MOOD TAG (last line only, nothing after):
[mood:anxious] | [mood:sad] | [mood:overwhelmed] | [mood:calm] | [mood:happy] | [mood:neutral] | [mood:angry] | [mood:lonely]"""


def analyze_mood_patterns(mood_log: list, history: list) -> dict:
    """Extract meaningful patterns from mood history and chat."""
    patterns = {}

    if mood_log:
        moods = [m["mood"] for m in mood_log]
        counts = Counter(moods)
        total  = len(moods)

        # Dominant mood this week (last 7 entries)
        recent = moods[:7]
        if recent:
            dominant = Counter(recent).most_common(1)[0]
            patterns["dominant_mood"] = dominant[0]
            patterns["dominant_count"] = dominant[1]
            patterns["total_logs"] = total

        # Trend: is mood improving or declining?
        if len(moods) >= 4:
            mood_score = {"sad": 1, "lonely": 1, "anxious": 2, "overwhelmed": 2,
                          "angry": 2, "neutral": 3, "calm": 4, "happy": 5, "great": 5}
            older = moods[len(moods)//2:]
            newer = moods[:len(moods)//2]
            older_avg = sum(mood_score.get(m, 3) for m in older) / len(older)
            newer_avg = sum(mood_score.get(m, 3) for m in newer) / len(newer)
            if newer_avg > older_avg + 0.5:
                patterns["trend"] = "improving"
            elif newer_avg < older_avg - 0.5:
                patterns["trend"] = "declining"
            else:
                patterns["trend"] = "stable"

    # Recurring themes from chat history
    if history:
        all_text = " ".join(m["content"] for m in history if m["role"] == "user").lower()
        theme_keywords = {
            "work/study": ["work", "job", "exam", "deadline", "boss", "college", "project", "internship"],
            "sleep":      ["sleep", "insomnia", "tired", "exhausted", "can't sleep", "wake up"],
            "anxiety":    ["anxious", "anxiety", "worry", "worried", "nervous", "panic", "stress"],
            "loneliness": ["alone", "lonely", "no one", "nobody", "isolated", "friends"],
            "relationships": ["friend", "family", "partner", "boyfriend", "girlfriend", "parents"],
        }
        found_themes = []
        for theme, words in theme_keywords.items():
            hits = sum(1 for w in words if w in all_text)
            if hits >= 2:
                found_themes.append(theme)
        if found_themes:
            patterns["recurring_themes"] = found_themes

    return patterns


def build_system_prompt(nlp_result: dict, memories: list, mood_log: list, history: list) -> str:
    parts = [PERSONALITY]

    # ── Pattern analysis ───────────────────────────────────────
    patterns = analyze_mood_patterns(mood_log, history)

    pattern_lines = []
    if "dominant_mood" in patterns and patterns.get("dominant_count", 0) >= 2:
        pattern_lines.append(
            f"They've logged '{patterns['dominant_mood']}' "
            f"{patterns['dominant_count']} times recently."
        )
    if "trend" in patterns:
        trend_msg = {
            "improving": "Their mood has been gradually improving — acknowledge this positively.",
            "declining": "Their mood has been declining — be extra gentle and proactive.",
            "stable":    "Their mood has been fairly stable lately.",
        }
        pattern_lines.append(trend_msg[patterns["trend"]])
    if "recurring_themes" in patterns:
        themes = ", ".join(patterns["recurring_themes"])
        pattern_lines.append(
            f"Recurring themes in their conversations: {themes}. "
            f"If relevant, name this pattern aloud — e.g. 'You've mentioned {patterns['recurring_themes'][0]} a few times now...'"
        )

    if pattern_lines:
        parts.append(
            "\n[MOOD PATTERNS YOU'VE NOTICED]\n" +
            "\n".join(f"  • {p}" for p in pattern_lines)
        )

    # ── Long-term memories ─────────────────────────────────────
    if memories:
        mem_lines = "\n".join(f"  • {m['snippet']}" for m in memories[:10])
        parts.append(
            "\n[WHAT YOU REMEMBER ABOUT THIS PERSON]\n"
            f"{mem_lines}\n\n"
            "Use this to make replies personal and specific. "
            "Reference it naturally — weave it in, don't list it. "
            "Connect past to present. Examples of what good looks like:\n"
            "  ✅ 'You mentioned the internship earlier — how's that been sitting with you?'\n"
            "  ✅ 'Last time things felt this heavy, work was piling up — still the case?'\n"
            "  ❌ 'Based on my memory of your previous conversations...'"
        )

    # ── Current emotional state ────────────────────────────────
    emotions = nlp_result.get("emotions", [])
    sentiment = nlp_result.get("sentiment_label", "neutral")
    if emotions:
        parts.append(
            f"\n[RIGHT NOW] Detected emotions: {', '.join(emotions)}. "
            f"Sentiment: {sentiment}. "
            f"Let this shape your tone — don't ignore it."
        )

    # ── Crisis ────────────────────────────────────────────────
    if nlp_result.get("crisis_detected"):
        parts.append(
            "\n[⚠ CRISIS DETECTED] Drop everything else. "
            "Lead with warmth, not advice. Make them feel heard first. "
            "Then include the 988 line. Be the calmest, most present voice they could hear right now."
        )

    # ── Specific triggers ─────────────────────────────────────
    if nlp_result.get("activity_triggers"):
        triggers = ", ".join(nlp_result["activity_triggers"])
        parts.append(
            f"\n[SPECIFIC ISSUE] They mentioned: {triggers}. "
            f"Offer one concrete, targeted suggestion — not generic advice."
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
    mood_log: list = None,
) -> tuple[str, str]:
    """
    Returns (ai_reply_text, detected_mood).
    Full personality + memory + pattern analysis injected into system prompt.
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

    system_prompt = build_system_prompt(
        nlp_result,
        memories  or [],
        mood_log  or [],
        history,
    )

    messages = [{"role": "system", "content": system_prompt}]
    messages += format_history(history[-14:])
    messages.append({"role": "user", "content": user_message})

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=520,
            temperature=0.80,   # slightly higher = warmer, more human
            top_p=0.92,
        )
        raw   = completion.choices[0].message.content or "I'm here. Tell me more?"
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
        return (f"Connection hiccup — check your terminal.\nDetail: {err[:150]}", "neutral")