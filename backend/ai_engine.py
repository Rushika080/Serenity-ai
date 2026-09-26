"""
AI Engine - Serenity v4
Provider: Groq (free, no credit card, 14400 req/day)
Model: llama-3.3-70b-versatile
GET KEY: https://console.groq.com/keys
Add to backend/.env: GROQ_API_KEY=gsk_xxxxxxxxxxxx
"""

import os
import re
from collections import Counter
from dotenv import load_dotenv
from openai import OpenAI
from nlp_engine import get_primary_emotion

load_dotenv()

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
MODEL = "openai/gpt-oss-20b"

PERSONALITY = """You are Serenity, a calm, emotionally intelligent AI companion with a warm voice.

YOUR PERSONALITY:
- You speak like a wise, caring friend, not a therapist reading from a script
- You are gently curious, never preachy or lecture-y
- You use vivid human language with warmth and occasional gentle humour
- You validate before you advise, always acknowledge feelings first
- You are concise but never cold, every reply feels personal
- You notice patterns and name them: You have mentioned sleep a few times now...
- You connect dots between past and present naturally
- You celebrate small wins genuinely

WRITING STYLE:
- Never start with I understand or That sounds difficult, those are filler
- Never use bullet lists in replies, write in flowing warm sentences
- Ask only ONE question per reply, make it specific
- Keep replies to 3-5 sentences max unless explaining a technique
- Use natural phrases like: here is the thing, honestly, you know what

NEVER:
- Say As an AI or mention being an AI
- Give robotic bullet-pointed advice
- Diagnose or recommend medication
- Be sycophantic
- If crisis detected: always include this exact line: If you are in crisis, please call or text 988 (Suicide and Crisis Lifeline), available 24/7.

MOOD TAG - last line only, nothing after:
[mood:anxious] | [mood:sad] | [mood:overwhelmed] | [mood:calm] | [mood:happy] | [mood:neutral] | [mood:angry] | [mood:lonely]"""


def analyze_mood_patterns(mood_log, history):
    patterns = {}
    if mood_log:
        moods = [m["mood"] for m in mood_log]
        recent = moods[:7]
        if recent:
            dominant = Counter(recent).most_common(1)[0]
            patterns["dominant_mood"] = dominant[0]
            patterns["dominant_count"] = dominant[1]
        if len(moods) >= 4:
            score_map = {
                "sad": 1, "lonely": 1, "anxious": 2,
                "overwhelmed": 2, "angry": 2, "neutral": 3,
                "calm": 4, "happy": 5, "great": 5
            }
            half = len(moods) // 2
            o_avg = sum(score_map.get(m, 3) for m in moods[half:]) / len(moods[half:])
            n_avg = sum(score_map.get(m, 3) for m in moods[:half]) / len(moods[:half])
            if n_avg > o_avg + 0.5:
                patterns["trend"] = "improving"
            elif n_avg < o_avg - 0.5:
                patterns["trend"] = "declining"
            else:
                patterns["trend"] = "stable"
    if history:
        all_text = " ".join(
            m.get("content", "") for m in history if m.get("role") == "user"
        ).lower()
        themes = {
            "work/study": ["work", "job", "exam", "deadline", "boss", "college", "project", "internship"],
            "sleep": ["sleep", "insomnia", "tired", "exhausted", "wake up"],
            "anxiety": ["anxious", "anxiety", "worry", "worried", "nervous", "panic", "stress"],
            "loneliness": ["alone", "lonely", "no one", "nobody", "isolated"],
            "relationships": ["friend", "family", "partner", "boyfriend", "girlfriend", "parents"],
        }
        found = [t for t, words in themes.items() if sum(1 for w in words if w in all_text) >= 2]
        if found:
            patterns["recurring_themes"] = found
    return patterns


def build_system_prompt(nlp_result, memories, mood_log, history):
    parts = [PERSONALITY]
    patterns = analyze_mood_patterns(mood_log, history)

    lines = []
    if "dominant_mood" in patterns and patterns.get("dominant_count", 0) >= 2:
        lines.append(
            "They have logged '{}' {} times recently.".format(
                patterns["dominant_mood"], patterns["dominant_count"]
            )
        )
    if "trend" in patterns:
        trend_map = {
            "improving": "Their mood has been gradually improving, acknowledge this positively.",
            "declining": "Their mood has been declining, be extra gentle and proactive.",
            "stable": "Their mood has been fairly stable lately.",
        }
        lines.append(trend_map[patterns["trend"]])
    if "recurring_themes" in patterns:
        lines.append(
            "Recurring themes: {}. Name this naturally if relevant.".format(
                ", ".join(patterns["recurring_themes"])
            )
        )
    if lines:
        parts.append("\n[MOOD PATTERNS]\n" + "\n".join("  - " + l for l in lines))

    if memories:
        mem_text = "\n".join("  - " + m["snippet"] for m in memories[:10])
        parts.append(
            "\n[WHAT YOU REMEMBER ABOUT THIS PERSON]\n"
            + mem_text
            + "\n\nWeave these into your replies naturally. Connect past to present. "
            "Reference them like a friend who remembers, not like a database lookup."
        )

    emotions = nlp_result.get("emotions", [])
    if emotions:
        parts.append(
            "\n[RIGHT NOW] Detected emotions: {}. Sentiment: {}. Shape your tone accordingly.".format(
                ", ".join(emotions), nlp_result.get("sentiment_label", "neutral")
            )
        )
    if nlp_result.get("crisis_detected"):
        parts.append(
            "\n[CRISIS DETECTED] Lead with warmth. Make them feel heard first. "
            "You MUST include the 988 crisis line in your reply."
        )
    if nlp_result.get("activity_triggers"):
        parts.append(
            "\n[TRIGGERS] User mentioned: {}. Offer one concrete targeted suggestion.".format(
                ", ".join(nlp_result["activity_triggers"])
            )
        )

    return "\n".join(parts)


def format_history(history):
    return [
        {
            "role": "user" if r.get("role") == "user" else "assistant",
            "content": r.get("content", ""),
        }
        for r in history
        if r.get("content")
    ]


def extract_mood_tag(text):
    match = re.search(r"\[mood:(\w+)\]", text)
    mood = match.group(1) if match else "neutral"
    clean = re.sub(r"\[mood:\w+\]", "", text).strip()
    return clean, mood


def get_ai_response(user_message, history, nlp_result, memories=None, mood_log=None):
    token = os.getenv("GROQ_API_KEY", "").strip()

    print("[GROQ] key_loaded={} prefix={}".format(bool(token), token[:7] if token else "NONE"))

    if not token:
        print("[GROQ ERROR] GROQ_API_KEY missing.")
        return (
            "GROQ_API_KEY is missing from backend/.env\n\n"
            "Fix:\n"
            "1. Go to console.groq.com/keys\n"
            "2. Sign up free, email only, no card needed\n"
            "3. Create an API key\n"
            "4. Add to backend/.env: GROQ_API_KEY=gsk_your_key\n"
            "5. Restart the server",
            "neutral",
        )

    client = OpenAI(
        base_url=GROQ_BASE_URL,
        api_key=token,
    )

    system_prompt = build_system_prompt(
        nlp_result, memories or [], mood_log or [], history
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages += format_history(history[-14:])
    messages.append({"role": "user", "content": user_message})

    print("[GROQ] calling model={}".format(MODEL))

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=520,
            temperature=0.80,
            top_p=0.92,
        )
        raw = completion.choices[0].message.content if completion.choices else None
        raw = raw or "I am here. Tell me more?"
        clean, mood = extract_mood_tag(raw)
        if mood == "neutral" and nlp_result.get("emotions"):
            mood = get_primary_emotion(nlp_result) or "neutral"
        print("[GROQ] success")
        return clean, mood

    except Exception as e:
        err = str(e)
        err_l = err.lower()
        print("[GROQ ERROR] {}: {}".format(type(e).__name__, err))

        if "401" in err or "invalid api key" in err_l or "authentication" in err_l:
            return (
                "Groq API key is invalid. Go to console.groq.com/keys, "
                "create a new key, update GROQ_API_KEY in backend/.env, "
                "then restart the server.",
                "neutral",
            )
        if "429" in err or "rate limit" in err_l:
            return (
                "Rate limit reached on the free tier. "
                "Please wait a moment and try again.",
                "neutral",
            )
        if "503" in err or "unavailable" in err_l:
            return ("Service temporarily unavailable. Please try again shortly.", "neutral")
        if "timeout" in err_l:
            return ("Request timed out. Please try again.", "neutral")

        return ("Connection error. Check your terminal for details.", "neutral")