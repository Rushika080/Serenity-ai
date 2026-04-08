"""
NLP Engine — spaCy + TextBlob
Fixed emotion detection with broader keyword lists,
negation-aware matching, and accurate sentiment scoring.
"""

import re
from typing import Optional

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except Exception:
    SPACY_AVAILABLE = False
    nlp = None

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except Exception:
    TEXTBLOB_AVAILABLE = False


# ── Emotion keyword maps (expanded & fixed) ────────────────────
# Order matters — more specific emotions checked first
EMOTION_KEYWORDS = {
    "crisis": [
        "don't feel like living", "don't want to live", "want to die",
        "end my life", "kill myself", "suicide", "suicidal",
        "no reason to live", "better off dead", "can't go on",
        "give up on life", "hurt myself", "self harm", "self-harm",
        "not worth living", "feel like dying", "wish i was dead",
        "worthless", "better off without me",
    ],
    "overwhelmed": [
        "overwhelmed", "too much", "can't cope", "cant cope",
        "burnout", "burn out", "drowning", "swamped", "buried",
        "can't handle", "cant handle", "falling apart", "breaking down",
        "everything is too much", "too much pressure", "spinning",
    ],
    "anxious": [
        "anxious", "anxiety", "panic", "panicking", "nervous",
        "worried", "worry", "worrying", "fear", "scared", "afraid",
        "tense", "restless", "dread", "dreading", "on edge",
        "heart racing", "can't breathe", "cant breathe", "freaking out",
        "stressed out", "stress",
    ],
    "sad": [
        "sad", "sadness", "depressed", "depression", "cry", "crying",
        "tears", "hopeless", "empty", "grief", "grieving", "loss",
        "heartbroken", "miserable", "unhappy", "down", "blue",
        "gloomy", "sorrow", "sorrowful", "devastated", "broken",
        "not good at anything", "good at nothing", "failure", "failed",
        "worthless", "useless", "hate myself", "hate my life",
        "nothing matters", "no point", "feel like nothing",
        "feel like i'm not", "feel like im not", "not good enough",
    ],
    "angry": [
        "angry", "anger", "furious", "rage", "irritated", "frustrated",
        "frustration", "annoyed", "mad", "livid", "hate", "pissed",
        "resentful", "bitter", "outraged",
    ],
    "lonely": [
        "lonely", "loneliness", "alone", "isolated", "isolation",
        "no one", "nobody", "abandoned", "invisible", "disconnected",
        "no friends", "no one cares", "nobody cares", "left out",
        "excluded", "rejected", "unwanted",
    ],
    "happy": [
        "happy", "happiness", "great", "excited", "joy", "joyful",
        "wonderful", "amazing", "fantastic", "grateful", "thankful",
        "blessed", "content", "pleased", "delighted", "cheerful",
        "thrilled", "ecstatic",
    ],
    "calm": [
        "calm", "peaceful", "relaxed", "okay", "alright",
        "settled", "serene", "fine", "at peace", "better now",
        "feeling good", "good today",
    ],
}

# Phrases that signal the user is NOT feeling positive
# (override TextBlob which can incorrectly score these as positive)
NEGATIVE_OVERRIDE_PHRASES = [
    "not good at", "not good enough", "not worth", "can't do anything",
    "cant do anything", "no good", "feel like nothing", "feel worthless",
    "hate myself", "hate my life", "not happy", "never happy",
    "don't feel", "dont feel", "no longer", "not anymore",
    "wish i was", "wish i were", "if only i",
]

CRISIS_SIGNALS = [
    "kill myself", "end my life", "want to die", "suicide", "suicidal",
    "self harm", "self-harm", "hurt myself", "no reason to live",
    "can't go on", "give up on life", "better off dead",
    "don't want to be here", "not worth living", "feel like dying",
    "wish i was dead", "better off without me",
    "don't feel like living", "don't want to live",
]

ACTIVITY_TRIGGERS = [
    "can't sleep", "cant sleep", "insomnia", "no appetite", "not eating",
    "isolating", "no motivation", "can't focus", "cant focus",
    "distracted", "procrastinating", "no energy", "tired all the time",
    "exhausted", "can't get up", "cant get up",
]


def analyze_message(text: str) -> dict:
    text_lower = text.lower().strip()

    result = {
        "original": text,
        "sentiment_score": 0.0,
        "sentiment_label": "neutral",
        "emotions": [],
        "crisis_detected": False,
        "crisis_signals": [],
        "activity_triggers": [],
        "entities": [],
        "keywords": [],
        "word_count": len(text.split()),
        "spacy_available": SPACY_AVAILABLE,
    }

    # ── Crisis detection (always first, highest priority) ──────
    triggered_crisis = [sig for sig in CRISIS_SIGNALS if sig in text_lower]
    if triggered_crisis:
        result["crisis_detected"] = True
        result["crisis_signals"] = triggered_crisis

    # ── Emotion detection (priority order) ────────────────────
    detected = []
    # Check crisis emotions first
    if result["crisis_detected"]:
        detected.append("crisis")

    priority_order = ["overwhelmed", "anxious", "sad", "angry", "lonely", "happy", "calm"]
    for emotion in priority_order:
        keywords = EMOTION_KEYWORDS.get(emotion, [])
        if any(kw in text_lower for kw in keywords):
            detected.append(emotion)

    result["emotions"] = detected[:4]  # cap at 4

    # ── Sentiment scoring ──────────────────────────────────────
    # Check for negative override phrases first (TextBlob gets these wrong)
    has_negative_override = any(phrase in text_lower for phrase in NEGATIVE_OVERRIDE_PHRASES)

    if has_negative_override:
        result["sentiment_score"] = -0.5
        result["sentiment_label"] = "negative"
    elif TEXTBLOB_AVAILABLE:
        blob = TextBlob(text)
        score = round(blob.sentiment.polarity, 3)

        # If negative emotions detected but TextBlob says positive, override
        negative_emotions = {"crisis", "overwhelmed", "anxious", "sad", "angry", "lonely"}
        has_neg_emotion = bool(set(detected) & negative_emotions)

        if has_neg_emotion and score > 0.1:
            # TextBlob is wrong — force negative
            score = -abs(score) - 0.1
            score = round(max(score, -1.0), 3)

        result["sentiment_score"] = score
        if score >= 0.15:
            result["sentiment_label"] = "positive"
        elif score <= -0.1:
            result["sentiment_label"] = "negative"
        else:
            result["sentiment_label"] = "neutral"
    else:
        # Fallback without TextBlob
        neg_emotions = {"crisis", "overwhelmed", "anxious", "sad", "angry", "lonely"}
        pos_emotions = {"happy", "calm"}
        neg_count = len(set(detected) & neg_emotions)
        pos_count = len(set(detected) & pos_emotions)
        if neg_count > 0:
            result["sentiment_label"] = "negative"
            result["sentiment_score"] = round(-0.3 * neg_count, 3)
        elif pos_count > 0:
            result["sentiment_label"] = "positive"
            result["sentiment_score"] = 0.4

    # ── Activity triggers ──────────────────────────────────────
    result["activity_triggers"] = [t for t in ACTIVITY_TRIGGERS if t in text_lower]

    # ── spaCy: entities + keywords ─────────────────────────────
    if SPACY_AVAILABLE and nlp:
        doc = nlp(text)
        result["entities"] = [
            {"text": ent.text, "label": ent.label_}
            for ent in doc.ents
            if ent.label_ in ("PERSON", "ORG", "GPE", "EVENT", "DATE", "TIME")
        ]
        result["keywords"] = list(set(
            token.lemma_.lower()
            for token in doc
            if not token.is_stop and not token.is_punct
            and token.pos_ in ("NOUN", "ADJ", "VERB")
            and len(token.text) > 3
        ))[:10]

    return result


def get_primary_emotion(nlp_result: dict) -> Optional[str]:
    emotions = nlp_result.get("emotions", [])
    if not emotions:
        label = nlp_result.get("sentiment_label", "neutral")
        return "happy" if label == "positive" else ("sad" if label == "negative" else "neutral")
    priority = ["crisis", "overwhelmed", "anxious", "sad", "angry", "lonely", "calm", "happy"]
    for p in priority:
        if p in emotions:
            return p
    return emotions[0]