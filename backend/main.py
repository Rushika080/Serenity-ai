# ── Load .env FIRST — must be before any import that reads env vars ──
from dotenv import load_dotenv
load_dotenv()  # loads HF_TOKEN and DB_PATH from backend/.env

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import uvicorn

from nlp_engine import analyze_message
from ai_engine import get_ai_response
from database import (
    init_db, save_message, get_history,
    save_mood, get_moods,
    save_memory, get_memories, clear_memories
)

app = FastAPI(title="Serenity Mental Health API", version="2.0.0")

# ── CORS — allow React dev server and any other origin ───────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ── Schemas ───────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    user_id: str = "default"
    message: str

class MoodRequest(BaseModel):
    user_id: str = "default"
    mood: str
    note: Optional[str] = None

class ClearRequest(BaseModel):
    user_id: str = "default"


# ── Routes ────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "Serenity API is running 🌿"}


@app.post("/chat")
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    nlp_result = analyze_message(req.message)
    history    = get_history(req.user_id, limit=20)
    memories   = get_memories(req.user_id)

    ai_reply, detected_mood = await asyncio.to_thread(
        get_ai_response, req.message, history, nlp_result, memories
    )

    save_message(req.user_id, "user",      req.message, nlp_result["sentiment_label"])
    save_message(req.user_id, "assistant", ai_reply,    detected_mood)
    save_memory(req.user_id, req.message)

    return {"reply": ai_reply, "mood": detected_mood, "nlp": nlp_result}


@app.get("/history/{user_id}")
def history(user_id: str, limit: int = 30):
    return {"messages": get_history(user_id, limit)}


@app.post("/mood")
def log_mood(req: MoodRequest):
    save_mood(req.user_id, req.mood, req.note)
    return {"status": "logged", "mood": req.mood}


@app.get("/mood/{user_id}")
def mood_history(user_id: str):
    return {"moods": get_moods(user_id)}


@app.get("/memories/{user_id}")
def memories(user_id: str):
    return {"memories": get_memories(user_id)}


@app.post("/memories/clear")
def clear_mem(req: ClearRequest):
    clear_memories(req.user_id)
    return {"status": "cleared"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)