"""
Auth module — JWT-based authentication
- Passwords hashed with bcrypt
- Tokens signed with HS256 JWT
- 7-day expiry
"""

import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends, Header
from typing import Optional

JWT_SECRET  = os.environ.get("JWT_SECRET", "serenity-super-secret-change-in-production")
JWT_ALGO    = "HS256"
JWT_EXPIRY_DAYS = 7


# ── Password hashing ───────────────────────────────────────────
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


# ── JWT tokens ─────────────────────────────────────────────────
def create_token(user_id: str, username: str) -> str:
    payload = {
        "sub":      user_id,
        "username": username,
        "exp":      datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "iat":      datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token. Please log in again.")


# ── FastAPI dependency — protects routes ───────────────────────
def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """
    Use as a FastAPI dependency: current_user = Depends(get_current_user)
    Returns {"sub": user_id, "username": username}
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated. Please log in.")
    token = authorization.split(" ", 1)[1]
    return decode_token(token)