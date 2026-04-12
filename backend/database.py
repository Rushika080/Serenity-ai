"""
Database layer — SQLite.
Tables: users, messages, mood_log, memories
"""

import sqlite3
import os
import re

DB_PATH = os.getenv("DB_PATH", "serenity.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id         TEXT    PRIMARY KEY,
                username   TEXT    NOT NULL UNIQUE,
                email      TEXT    NOT NULL UNIQUE,
                password   TEXT    NOT NULL,
                created_at TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS messages (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    TEXT    NOT NULL,
                role       TEXT    NOT NULL,
                content    TEXT    NOT NULL,
                mood       TEXT,
                created_at TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS mood_log (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    TEXT    NOT NULL,
                mood       TEXT    NOT NULL,
                note       TEXT,
                created_at TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS memories (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    TEXT    NOT NULL,
                snippet    TEXT    NOT NULL,
                category   TEXT    DEFAULT 'general',
                created_at TEXT    DEFAULT (datetime('now'))
            );
        """)


# ── Users ──────────────────────────────────────────────────────
def create_user(user_id: str, username: str, email: str, hashed_password: str):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)",
            (user_id, username.strip().lower(), email.strip().lower(), hashed_password),
        )


def get_user_by_username(username: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username=?", (username.strip().lower(),)
        ).fetchone()
    return dict(row) if row else None


def get_user_by_email(email: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE email=?", (email.strip().lower(),)
        ).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> dict | None:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
    return dict(row) if row else None


# ── Messages ───────────────────────────────────────────────────
def save_message(user_id: str, role: str, content: str, mood: str = None):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO messages (user_id, role, content, mood) VALUES (?, ?, ?, ?)",
            (user_id, role, content, mood),
        )


def get_history(user_id: str, limit: int = 20) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT role, content, mood, created_at FROM messages "
            "WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [dict(r) for r in reversed(rows)]


# ── Mood log ───────────────────────────────────────────────────
def save_mood(user_id: str, mood: str, note: str = None):
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO mood_log (user_id, mood, note) VALUES (?, ?, ?)",
            (user_id, mood, note),
        )


def get_moods(user_id: str, limit: int = 30) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT mood, note, created_at FROM mood_log "
            "WHERE user_id=? ORDER BY id DESC LIMIT ?",
            (user_id, limit),
        ).fetchall()
    return [dict(r) for r in rows]


# ── Memory ─────────────────────────────────────────────────────
MEMORY_PATTERNS = [
    (r"(intern|job|work|office|boss|colleague|project|deadline|exam|college|university|school|class)", "work/study"),
    (r"(friend|family|parent|mother|father|sister|brother|partner|boyfriend|girlfriend|wife|husband|divorce|breakup|relationship)", "relationships"),
    (r"(sleep|insomnia|headache|pain|tired|exhausted|medication|therapy|therapist|doctor|anxiety|depression|panic)", "health"),
    (r"(feel|feeling|overwhelmed|lonely|sad|cry|angry|scared|hopeless|worthless|struggle|difficult|hard time)", "emotions"),
    (r"(selected|promoted|achieved|got|passed|graduated|won|happy|excited|grateful|birthday|anniversary)", "positive"),
    (r"(want to|trying to|plan|goal|hope|wish|dream|future|career|change)", "goals"),
]


def should_save_memory(text: str) -> bool:
    if len(text.split()) < 5:
        return False
    text_l = text.lower()
    fillers = ["okay", "ok", "thanks", "thank you", "yes", "no", "sure", "got it", "i see"]
    if text_l.strip() in fillers:
        return False
    for pattern, _ in MEMORY_PATTERNS:
        if re.search(pattern, text_l):
            return True
    return False


def extract_memory_category(text: str) -> str:
    text_l = text.lower()
    for pattern, category in MEMORY_PATTERNS:
        if re.search(pattern, text_l):
            return category
    return "general"


def save_memory(user_id: str, snippet: str, category: str = None):
    if not should_save_memory(snippet):
        return
    cat = category or extract_memory_category(snippet)
    if len(snippet) > 120:
        snippet = snippet[:117] + "…"
    with get_conn() as conn:
        conn.execute(
            "DELETE FROM memories WHERE user_id=? AND id NOT IN "
            "(SELECT id FROM memories WHERE user_id=? ORDER BY id DESC LIMIT 19)",
            (user_id, user_id),
        )
        conn.execute(
            "INSERT INTO memories (user_id, snippet, category) VALUES (?, ?, ?)",
            (user_id, snippet, cat),
        )


def get_memories(user_id: str) -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT snippet, category, created_at FROM memories WHERE user_id=? ORDER BY id DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def clear_memories(user_id: str):
    with get_conn() as conn:
        conn.execute("DELETE FROM memories WHERE user_id=?", (user_id,))