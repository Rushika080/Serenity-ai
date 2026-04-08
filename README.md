# Serenity — AI Mental Health Assistant
### Full-Stack: FastAPI + spaCy + SQLite + React

---

## Project Structure

```
serenity/
├── backend/
│   ├── main.py          # FastAPI app + all routes
│   ├── nlp_engine.py    # spaCy + TextBlob NLP processing
│   ├── ai_engine.py     # OpenAI integration
│   ├── database.py      # SQLite CRUD layer
│   ├── requirements.txt # Python dependencies
│   └── .env             # Your API key (create this)
│
└── frontend/
    └── App.jsx          # React frontend (calls localhost:8000)
```

---

## Tech Stack

| Layer        | Technology                          | Purpose                              |
|-------------|--------------------------------------|--------------------------------------|
| API Server  | FastAPI + Uvicorn                    | REST endpoints, async support        |
| NLP         | spaCy (en_core_web_sm) + TextBlob    | Tokenization, sentiment, emotions    |
| AI          | HuggingFace Router(OpenAI-compatible)| Empathetic responses                 |
| Prompting   | LangChain-style dynamic prompt build | NLP-aware system prompt injection    |
| Database    | SQLite (built-in, no setup needed)   | Chat history, mood log, memories     |
| Frontend    | React JSX                            | Chat UI, tabs, mood tracker          |

---

## Backend Setup

### 1. Create virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Download spaCy model
```bash
python -m spacy download en_core_web_sm
```

### 4. Download TextBlob corpora
```bash
python -m textblob.download_corpora
```

### 5. Create .env file
```bash
# backend/.env
HF_API_KEY=your_hf_api_key_here
DB_PATH=serenity.db
```

### 6. Run the server
```bash
uvicorn main:app --reload --port 8000
```

Server runs at: http://localhost:8000
API docs at:    http://localhost:8000/docs

---

## Frontend Setup

Standalone React app
```bash
npx create-react-app serenity-ui
cd serenity-ui
cp ../frontend/App.jsx src/App.jsx
npm start
```

---

## API Endpoints

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| POST   | /chat                     | Send message, get AI reply + NLP   |
| GET    | /history/{user_id}        | Fetch conversation history         |
| POST   | /mood                     | Log a mood entry                   |
| GET    | /mood/{user_id}           | Get mood history                   |
| GET    | /memories/{user_id}       | Get stored memory snippets         |
| POST   | /memories/clear           | Clear all memories for user        |
| GET    | /health                   | Health check                       |

### Example /chat request
```json
POST /chat
{
  "user_id": "user_001",
  "message": "I've been feeling overwhelmed with work lately"
}
```

### Example /chat response
```json
{
  "reply": "I hear you — that pressure can be really exhausting...",
  "mood": "overwhelmed",
  "nlp": {
    "sentiment_score": -0.35,
    "sentiment_label": "negative",
    "emotions": ["overwhelmed", "anxious"],
    "crisis_detected": false,
    "keywords": ["work", "overwhelmed", "feeling"],
    "activity_triggers": []
  }
}
```

---

## Features

- **NLP preprocessing** — spaCy tokenizes + lemmatizes text before it reaches Claude
- **Sentiment analysis** — TextBlob scores polarity (-1 to +1)
- **Emotion detection** — 8 emotion categories via keyword matching
- **Crisis detection** — Scans for self-harm signals, auto-injects 988 Lifeline into response
- **Dynamic prompting** — System prompt enriched with NLP context per message
- **SQLite persistence** — All chats, moods, and memories stored locally
- **Memory auto-save** — User messages > 25 chars saved as memory snippets
- **Mood tracker** — Emoji-based mood logging with timestamp
- **Instant Joy tab** — Shufflable activity cards + affirmation + box breathing timer
- **NLP badges** — Frontend shows sentiment score + detected emotions per message

---

## Crisis Safety
If the user sends a message containing crisis signals (e.g. "want to die", "hurt myself"),
the AI engine automatically includes this in the AI reply:

> "If you're in crisis, please call or text 988 (Suicide & Crisis Lifeline) — available 24/7."

---

## Production Notes
- Replace `USER_ID = "user_001"` with a proper auth system (JWT recommended)
- Add HTTPS + reverse proxy (nginx) before deploying
- Use PostgreSQL instead of SQLite for multi-user production
- Rate-limit the /chat endpoint to prevent abuse
