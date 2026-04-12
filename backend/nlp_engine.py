"""
NLP Engine — Pure Python (no spaCy, no C compilation needed)
Uses TextBlob for sentiment + custom keyword/emotion logic.
Identical output format — drop-in replacement.
Works on Python 3.13 with zero build issues.
"""

import re
from typing import Optional

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except Exception:
    TEXTBLOB_AVAILABLE = False

SPACY_AVAILABLE = False   # not used — kept for API compatibility

# ── Stop words (lightweight built-in set) ─────────────────────
STOP_WORDS = {
    "i","me","my","myself","we","our","you","your","he","she","it","they","them",
    "what","which","who","is","are","was","were","be","been","being","have","has",
    "had","do","does","did","will","would","could","should","may","might","must",
    "the","a","an","and","but","or","so","yet","for","nor","of","at","by","in",
    "on","to","up","as","into","with","about","after","before","between","through",
    "that","this","these","those","am","its","than","then","there","just","also",
    "very","really","feel","feeling","like","know","think","want","need","get",
    "make","go","going","well","still","even","back","also","from","out","off",
    "when","where","how","if","because","while","though","although","since",
}

# ── Emotion keyword maps ───────────────────────────────────────
EMOTION_KEYWORDS = {
    "crisis": [
        "don't feel like living","don't want to live","want to die","end my life",
        "kill myself","suicide","suicidal","no reason to live","better off dead",
        "can't go on","give up on life","hurt myself","self harm","self-harm",
        "not worth living","feel like dying","wish i was dead","better off without me",
    ],
    "overwhelmed": [
        "overwhelmed","too much","can't cope","cant cope","burnout","burn out",
        "drowning","swamped","buried","can't handle","cant handle",
        "falling apart","breaking down","everything is too much","spinning",
    ],
    "anxious": [
        "anxious","anxiety","panic","panicking","nervous","worried","worry",
        "worrying","fear","scared","afraid","tense","restless","dread","dreading",
        "on edge","heart racing","can't breathe","cant breathe","freaking out",
        "stressed out","stress",
    ],
    "sad": [
        "sad","sadness","depressed","depression","cry","crying","tears","hopeless",
        "empty","grief","grieving","loss","heartbroken","miserable","unhappy",
        "down","blue","gloomy","sorrow","devastated","broken","not good at anything",
        "good at nothing","failure","failed","worthless","useless","hate myself",
        "hate my life","nothing matters","no point","feel like nothing",
        "feel like i'm not","feel like im not","not good enough",
    ],
    "angry": [
        "angry","anger","furious","rage","irritated","frustrated","frustration",
        "annoyed","mad","livid","hate","pissed","resentful","bitter","outraged",
    ],
    "lonely": [
        "lonely","loneliness","alone","isolated","isolation","no one","nobody",
        "abandoned","invisible","disconnected","no friends","no one cares",
        "nobody cares","left out","excluded","rejected","unwanted",
    ],
    "happy": [
        "happy","happiness","great","excited","joy","joyful","wonderful","amazing",
        "fantastic","grateful","thankful","blessed","content","pleased",
        "delighted","cheerful","thrilled","ecstatic","selected","promoted",
        "achieved","passed","graduated","won","internship",
    ],
    "calm": [
        "calm","peaceful","relaxed","okay","alright","settled","serene","fine",
        "at peace","better now","feeling good","good today",
    ],
}

NEGATIVE_OVERRIDE_PHRASES = [
    "not good at","not good enough","not worth","can't do anything","cant do anything",
    "no good","feel like nothing","feel worthless","hate myself","hate my life",
    "not happy","never happy","don't feel","dont feel","no longer","not anymore",
    "wish i was","wish i were","if only i",
]

CRISIS_SIGNALS = [
    "kill myself","end my life","want to die","suicide","suicidal","self harm",
    "self-harm","hurt myself","no reason to live","can't go on","give up on life",
    "better off dead","don't want to be here","not worth living","feel like dying",
    "wish i was dead","better off without me","don't feel like living","don't want to live",
]

ACTIVITY_TRIGGERS = [
    "can't sleep","cant sleep","insomnia","no appetite","not eating","isolating",
    "no motivation","can't focus","cant focus","distracted","procrastinating",
    "no energy","tired all the time","exhausted","can't get up","cant get up",
]


def _extract_keywords(text: str) -> list[str]:
    """Simple keyword extraction — nouns/descriptive words, no stop words."""
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    seen, keywords = set(), []
    for w in words:
        if w not in STOP_WORDS and w not in seen:
            seen.add(w)
            keywords.append(w)
    return keywords[:10]


def analyze_message(text: str) -> dict:
    text_lower = text.lower().strip()

    result = {
        "original":          text,
        "sentiment_score":   0.0,
        "sentiment_label":   "neutral",
        "emotions":          [],
        "crisis_detected":   False,
        "crisis_signals":    [],
        "activity_triggers": [],
        "entities":          [],
        "keywords":          _extract_keywords(text),
        "word_count":        len(text.split()),
        "spacy_available":   False,
    }

    # ── Crisis detection (highest priority) ───────────────────
    triggered = [s for s in CRISIS_SIGNALS if s in text_lower]
    if triggered:
        result["crisis_detected"]  = True
        result["crisis_signals"]   = triggered

    # ── Emotion detection ──────────────────────────────────────
    detected = []
    if result["crisis_detected"]:
        detected.append("crisis")
    for emotion in ["overwhelmed","anxious","sad","angry","lonely","happy","calm"]:
        if any(kw in text_lower for kw in EMOTION_KEYWORDS[emotion]):
            detected.append(emotion)
    result["emotions"] = detected[:4]

    # ── Sentiment scoring ──────────────────────────────────────
    has_neg_override = any(p in text_lower for p in NEGATIVE_OVERRIDE_PHRASES)
    if has_neg_override:
        result["sentiment_score"]  = -0.5
        result["sentiment_label"]  = "negative"
    elif TEXTBLOB_AVAILABLE:
        blob  = TextBlob(text)
        score = round(blob.sentiment.polarity, 3)
        neg_emotions = {"crisis","overwhelmed","anxious","sad","angry","lonely"}
        if bool(set(detected) & neg_emotions) and score > 0.1:
            score = round(max(-abs(score) - 0.1, -1.0), 3)
        result["sentiment_score"] = score
        if score >= 0.15:
            result["sentiment_label"] = "positive"
        elif score <= -0.1:
            result["sentiment_label"] = "negative"
        else:
            result["sentiment_label"] = "neutral"
    else:
        neg_set = {"crisis","overwhelmed","anxious","sad","angry","lonely"}
        pos_set = {"happy","calm"}
        nc = len(set(detected) & neg_set)
        pc = len(set(detected) & pos_set)
        if nc > 0:
            result["sentiment_label"] = "negative"
            result["sentiment_score"] = round(-0.3 * nc, 3)
        elif pc > 0:
            result["sentiment_label"] = "positive"
            result["sentiment_score"] = 0.4

    # ── Activity triggers ──────────────────────────────────────
    result["activity_triggers"] = [t for t in ACTIVITY_TRIGGERS if t in text_lower]

    return result


def get_primary_emotion(nlp_result: dict) -> Optional[str]:
    emotions = nlp_result.get("emotions", [])
    if not emotions:
        label = nlp_result.get("sentiment_label","neutral")
        return "happy" if label=="positive" else ("sad" if label=="negative" else "neutral")
    priority = ["crisis","overwhelmed","anxious","sad","angry","lonely","calm","happy"]
    for p in priority:
        if p in emotions:
            return p
    return emotions[0]