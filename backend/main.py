# ── Load .env FIRST ────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import asyncio
import uuid
import uvicorn

from auth import hash_password, verify_password, create_token, get_current_user
from nlp_engine import analyze_message
from ai_engine import get_ai_response
from database import (
    init_db,
    create_user, get_user_by_username, get_user_by_email,
    save_message, get_history,
    save_mood, get_moods,
    save_memory, get_memories, clear_memories
)

app = FastAPI(title="Serenity Mental Health API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


# ── Schemas ────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str       # accepts username OR email
    password: str

class ChatRequest(BaseModel):
    message: str

class MoodRequest(BaseModel):
    mood: str
    note: Optional[str] = None

class ClearRequest(BaseModel):
    pass


# ── Auth routes (public) ───────────────────────────────────────
@app.post("/auth/register")
def register(req: RegisterRequest):
    # Validate
    if len(req.username.strip()) < 3:
        raise HTTPException(400, "Username must be at least 3 characters.")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    if "@" not in req.email:
        raise HTTPException(400, "Invalid email address.")

    # Check duplicates
    if get_user_by_username(req.username):
        raise HTTPException(409, "Username already taken.")
    if get_user_by_email(req.email):
        raise HTTPException(409, "Email already registered.")

    user_id = str(uuid.uuid4())
    hashed  = hash_password(req.password)
    create_user(user_id, req.username, req.email, hashed)

    token = create_token(user_id, req.username.strip().lower())
    return {
        "token":    token,
        "user_id":  user_id,
        "username": req.username.strip().lower(),
        "message":  "Account created successfully 🌿"
    }


@app.post("/auth/login")
def login(req: LoginRequest):
    # Try username first, then email
    user = get_user_by_username(req.username) or get_user_by_email(req.username)
    if not user:
        raise HTTPException(401, "No account found with that username or email.")
    if not verify_password(req.password, user["password"]):
        raise HTTPException(401, "Incorrect password.")

    token = create_token(user["id"], user["username"])
    return {
        "token":    token,
        "user_id":  user["id"],
        "username": user["username"],
        "message":  f"Welcome back, {user['username']} 🌿"
    }


# ── Protected routes ───────────────────────────────────────────
@app.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"user_id": current_user["sub"], "username": current_user["username"]}


@app.post("/chat")
async def chat(req: ChatRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["sub"]
    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty")

    nlp_result = analyze_message(req.message)
    history    = get_history(user_id, limit=20)
    memories   = get_memories(user_id)
    mood_log   = get_moods(user_id, limit=30)

    ai_reply, detected_mood = await asyncio.to_thread(
        get_ai_response, req.message, history, nlp_result, memories, mood_log
    )

    save_message(user_id, "user",      req.message, nlp_result["sentiment_label"])
    save_message(user_id, "assistant", ai_reply,    detected_mood)
    save_memory(user_id, req.message)

    return {"reply": ai_reply, "mood": detected_mood, "nlp": nlp_result}


@app.get("/history")
def history(current_user: dict = Depends(get_current_user), limit: int = 30):
    return {"messages": get_history(current_user["sub"], limit)}


@app.post("/mood")
def log_mood(req: MoodRequest, current_user: dict = Depends(get_current_user)):
    save_mood(current_user["sub"], req.mood, req.note)
    return {"status": "logged", "mood": req.mood}


@app.get("/mood")
def mood_history(current_user: dict = Depends(get_current_user)):
    return {"moods": get_moods(current_user["sub"])}


@app.get("/memories")
def memories(current_user: dict = Depends(get_current_user)):
    return {"memories": get_memories(current_user["sub"])}


@app.post("/memories/clear")
def clear_mem(current_user: dict = Depends(get_current_user)):
    clear_memories(current_user["sub"])
    return {"status": "cleared"}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)