<div align="center">

<img src="https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white"/>
<img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
<img src="https://img.shields.io/badge/HuggingFace-Qwen2.5-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black"/>
<img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white"/>
<img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white"/>

# 🌿 Serenity — AI Mental Health Companion

**A full-stack AI-powered mental wellness chatbot with emotion detection, persistent memory, mood tracking, and JWT authentication.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Architecture](#-architecture) • [Screenshots](#-screenshots)

</div>

---

## 🧠 What is Serenity?

Serenity is a **production-grade AI mental health companion** built with a FastAPI backend and React frontend. It uses the HuggingFace Inference API (Qwen 2.5-7B) to deliver empathetic, context-aware responses — not generic replies.

What makes it different from a basic chatbot:

- **It remembers you.** Memories are extracted from conversations, categorised, and injected into every AI prompt so responses reference your past context naturally.
- **It detects your emotions.** A custom NLP pipeline scores sentiment, detects 8 emotion categories, and flags crisis signals — all before the message reaches the AI.
- **It notices patterns.** Mood trend analysis (improving / declining / stable) and recurring themes (work, sleep, anxiety) are surfaced to the AI so it can say *"You've mentioned sleep a few times now..."* rather than generic advice.
- **It's yours alone.** JWT authentication ensures every user's data — memories, mood log, chat history — is completely isolated. Nothing is shared.

---

## ✨ Features

| Feature | Description |
|---|---|
| 💬 **AI Chat** | Empathetic responses powered by Qwen 2.5-7B via HuggingFace Router |
| 🧠 **Persistent Memory** | Meaningful facts auto-extracted and stored in SQLite, injected into every AI prompt |
| 📊 **Mood Tracker** | Log daily moods, visualise trends with a bar chart |
| ⚡ **Instant Joy** | Curated mood-boost activities + daily affirmations + box breathing timer |
| 🔍 **Emotion Detection** | Custom NLP: 8 emotion categories, sentiment scoring, crisis signal detection |
| 📈 **Pattern Analysis** | Detects mood trends and recurring themes across conversation history |
| 🆘 **Crisis Awareness** | Automatically injects 988 Lifeline info when distress signals are detected |
| 🔐 **JWT Auth** | Register/login with bcrypt-hashed passwords, 7-day token expiry |
| 🔒 **Data Privacy** | All data stored locally in SQLite — never sent to external servers |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework with async support |
| **Uvicorn** | ASGI server |
| **OpenAI SDK** | Calls HuggingFace Router (OpenAI-compatible endpoint) |
| **HuggingFace** | `Qwen/Qwen2.5-7B-Instruct` for chat completions |
| **TextBlob** | Sentiment polarity scoring |
| **Custom NLP** | Pure-Python emotion detection, crisis detection, keyword extraction |
| **SQLite** | Local database — users, messages, mood log, memories |
| **PyJWT + bcrypt** | JWT authentication, password hashing |
| **python-dotenv** | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI |
| **CSS-in-JS** | Custom dark theme, animations, responsive layout |
| **Fetch API** | REST calls with JWT bearer token |
| **localStorage** | Token persistence across sessions |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.13+
- Node.js 18+ (for React dev server)
- A free HuggingFace account and Read token

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/serenity-ai.git
cd serenity-ai
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Download TextBlob data
python -m textblob.download_corpora
```

### 3. Configure environment

Create `backend/.env`:

```env
HF_TOKEN=hf_your_token_here
DB_PATH=serenity.db
JWT_SECRET=your-random-secret-string-here
```

Get your free HF token: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → New token → Role: Read

Generate a JWT secret:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Start the backend

```bash
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

### 5. Frontend setup

```bash
cd frontend

# If using Create React App
npx create-react-app serenity-ui
cd serenity-ui
cp ../App.jsx src/App.jsx
npm start
```

App runs at `http://localhost:3000`

---

## 📡 API Reference

### Authentication (Public)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Create new account |
| `POST` | `/auth/login` | Login, receive JWT |

### Protected Routes (require `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/me` | Get current user info |
| `POST` | `/chat` | Send message, get AI reply + NLP data |
| `GET` | `/history` | Fetch chat history |
| `POST` | `/mood` | Log a mood entry |
| `GET` | `/mood` | Get mood history |
| `GET` | `/memories` | Get stored memories |
| `POST` | `/memories/clear` | Clear all memories |
| `GET` | `/health` | Health check |

### Example: Chat request

```bash
curl -X POST http://localhost:8000/chat \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I feel overwhelmed with work lately"}'
```

```json
{
  "reply": "That kind of pressure can be really exhausting — especially when it feels like it won't let up. You've mentioned work a few times now... is it the volume of tasks, or something specific that's been building up? One thing that might help right now: write down just the top 3 things weighing on you most, and let the rest wait.",
  "mood": "overwhelmed",
  "nlp": {
    "sentiment_label": "negative",
    "sentiment_score": -0.4,
    "emotions": ["overwhelmed", "anxious"],
    "crisis_detected": false
  }
}
```

---

## 🏗 Architecture

```
serenity/
├── backend/
│   ├── main.py          # FastAPI app, all routes, JWT-protected endpoints
│   ├── auth.py          # JWT creation/validation, bcrypt password hashing
│   ├── ai_engine.py     # HuggingFace router calls, personality prompt, memory injection
│   ├── nlp_engine.py    # Emotion detection, sentiment scoring, crisis detection
│   ├── database.py      # SQLite CRUD — users, messages, mood_log, memories
│   ├── requirements.txt
│   └── .env             # HF_TOKEN, JWT_SECRET, DB_PATH
│
└── frontend/
    └── App.jsx          # React SPA — Auth screen + Main app (Chat, Joy, Mood, Memory)
```

### Data Flow

```
User Message
    │
    ▼
nlp_engine.py ──► Emotion detection, sentiment score, crisis check
    │
    ▼
database.py ──► Fetch: chat history (last 20) + memories (all) + mood log (last 30)
    │
    ▼
ai_engine.py ──► Build system prompt:
                  [Personality] + [Mood patterns] + [Memories] + [NLP context]
    │
    ▼
HuggingFace Router ──► Qwen2.5-7B-Instruct
    │
    ▼
Extract mood tag → Save to DB → Return to frontend
```

---

## Screenshot
<img width="1909" height="907" alt="Screenshot 2026-04-15 202812" src="https://github.com/user-attachments/assets/e35a4848-9376-4e2e-a2ee-dec34a6336b2" /><img width="1919" height="917" alt="Screenshot 2026-04-15 202910" src="https://github.com/user-attachments/assets/e2f0b516-857e-4485-94b7-6767d59af510" /><img width="1919" height="908" alt="Screenshot 2026-04-15 202956" src="https://github.com/user-attachments/assets/aa82f5e5-23cc-4e4d-b4eb-5d257f01dccc" /><img width="1912" height="888" alt="Screenshot 2026-04-15 203031" src="https://github.com/user-attachments/assets/6303008a-5bbe-42dd-8042-45474a765093" />

---

## 🔐 Security

- Passwords hashed with **bcrypt** (12 salt rounds)
- Authentication via **JWT (HS256)**, 7-day expiry
- All routes except `/auth/*` and `/health` require valid token
- User data fully isolated by `user_id` from JWT payload
- No external data transmission — all storage is local SQLite

---

## 🗺 Roadmap

- [ ] Voice input / text-to-speech output
- [ ] Weekly wellness email digest
- [ ] Guided CBT exercises
- [ ] Export mood data as PDF report
- [ ] Mobile app (React Native)
- [ ] Multi-language support

---

## ⚠️ Disclaimer

Serenity is an AI companion for general wellness support — **not a medical device or substitute for professional mental health care**. If you are experiencing a mental health crisis, please contact the **988 Suicide & Crisis Lifeline** (call or text 988, available 24/7).

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">
Built with 🌿 and a lot of care &nbsp;|&nbsp; Give it a ⭐ if you found it useful
</div>
