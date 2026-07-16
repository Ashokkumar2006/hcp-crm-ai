# HCP CRM — AI-First Log Interaction Module

An AI-first CRM module for pharmaceutical field sales reps to log Healthcare Professional (HCP)
interactions either through a structured form or a conversational AI assistant powered by
LangGraph + Groq.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Redux Toolkit, React Router, Vite |
| Backend | Python, FastAPI |
| AI Agent | LangGraph |
| LLM | Groq — `gemma2-9b-it` (primary), `llama-3.3-70b-versatile` (fallback) |
| Database | PostgreSQL (Neon) |

## Project Structure

```
hcp-crm-ai/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entry point
│   │   ├── db.py               # SQLAlchemy engine/session
│   │   ├── models.py           # All DB tables
│   │   ├── auth.py             # JWT helper
│   │   ├── schemas/schemas.py  # Pydantic request/response models
│   │   ├── routers/            # auth, hcps, catalog, interactions, agent
│   │   └── agent/
│   │       ├── llm.py          # Groq client wrapper
│   │       ├── state.py        # LangGraph agent state
│   │       ├── tools.py        # The 5 agent tools
│   │       └── graph.py        # LangGraph StateGraph assembly
│   ├── create_tables.py
│   ├── seed.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── components/{atoms,molecules,organisms}/
        ├── pages/{Login,Dashboard,LogInteraction}.jsx
        ├── redux/{store,slices/}
        └── api/axiosClient.js
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Fill in `.env` (copy from `.env.example`):
```
DATABASE_URL=<your Postgres connection string>
GROQ_API_KEY=<your Groq API key>
JWT_SECRET=<any random string>
JWT_ALGORITHM=HS256
```

```bash
python create_tables.py   # creates all tables
python seed.py             # inserts a test rep, HCPs, materials, samples
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs
Test login: `alex@repcorp.com` / `password123`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## The LangGraph AI Agent

### Role

The LangGraph agent sits behind the AI Assistant chat panel on the Log Interaction screen. Its
job is to let a field rep describe an HCP visit in plain language and have it become a
structured, queryable CRM record — without the rep touching the form. It classifies the intent
of each message, routes to the right tool, executes it against the database (using the Groq LLM
for extraction/generation where needed), and returns a short natural-language confirmation.

### Architecture

```
User message
    │
    ▼
classify_intent  (LLM decides which of the 5 tools applies)
    │
    ├── log_interaction
    ├── edit_interaction
    ├── suggest_followups
    ├── search_materials
    ├── sentiment_analysis
    └── general_chat (fallback)
    │
    ▼
finalize_response  (formats the tool's result into a chat reply)
```

### The 5 Tools

1. **`log_interaction`** *(mandatory)* — Takes the rep's free-text description, calls the LLM
   with a structured-extraction prompt to pull out HCP name, interaction type, topics, sentiment,
   materials/samples mentioned, attendees, and outcomes. Creates the HCP record if it doesn't
   exist, writes a new `Interaction` row, and links any matched materials/samples.

2. **`edit_interaction`** *(mandatory)* — Takes an open interaction plus a natural-language edit
   instruction (e.g. "change sentiment to positive"). The LLM diffs the instruction against the
   current record and returns only the fields that should change; those are patched onto the
   existing row without touching anything else.

3. **`suggest_followups`** — After an interaction is logged, generates 2–4 concrete follow-up
   actions via the LLM (e.g. "Schedule follow-up meeting in 2 weeks") and stores them as
   `FollowUpTask` rows flagged `ai_generated=True`.

4. **`search_materials`** — Searches the Materials/Samples catalog by keyword so the rep can find
   and attach the right brochure or sample without leaving the chat.

5. **`sentiment_analysis`** — Infers HCP sentiment (positive/neutral/negative) from the
   conversation text when the rep hasn't explicitly stated it.

## How the Chat and Form Stay in Sync

When the AI Assistant logs or edits an interaction, the frontend refetches that interaction by ID
and populates the structured form fields on the left — so the rep can always see and manually
adjust exactly what the AI captured before saving.

## Known Limitations (given assignment scope/timeline)

- Auth is intentionally minimal (single `rep` role, no refresh tokens, no SSO) — sufficient for
  this assignment's scope per the brief.
- No automated test suite; verification was done via manual endpoint testing.
- Voice note summarization button in the form is a UI placeholder (not wired to a transcription
  service) — out of scope per the assignment brief.
