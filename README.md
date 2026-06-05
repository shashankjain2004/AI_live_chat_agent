# AI Live Chat Support Agent

A full-stack AI customer support chat widget built for the **Spur Founding Full-Stack Engineer** take-home assignment. It simulates a live chat experience for a fictional e-commerce store ("Bloom & Ship"), powered by a real LLM API.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [How to Run Locally](#how-to-run-locally)
  - [Prerequisites](#prerequisites)
  - [1. Clone & Install](#1-clone--install)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Set Up the Database](#3-set-up-the-database)
  - [4. Start the Backend](#4-start-the-backend)
  - [5. Start the Frontend](#5-start-the-frontend)
- [Architecture Overview](#architecture-overview)
  - [Project Structure](#project-structure)
  - [Backend Layers](#backend-layers)
  - [Frontend Structure](#frontend-structure)
  - [Key Design Decisions](#key-design-decisions)
- [LLM Notes](#llm-notes)
  - [Provider](#provider)
  - [Prompting Strategy](#prompting-strategy)
  - [Cost Controls](#cost-controls)
  - [Error Handling](#error-handling)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Trade-offs & If I Had More Time](#trade-offs--if-i-had-more-time)

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Backend  | Node.js + TypeScript + Express                  |
| Frontend | React 18 + Vite + TypeScript                    |
| Database | SQLite via `better-sqlite3`                     |
| LLM      | Groq (free) — Llama 3.1 · or Anthropic Claude  |
| Validation | Zod                                           |

---

## How to Run Locally

### Prerequisites

- **Node.js 18+** — [download here](https://nodejs.org)
- **A free Groq API key** — [console.groq.com](https://console.groq.com) (no credit card required)
  - Alternatively, an Anthropic API key from [console.anthropic.com](https://console.anthropic.com) (paid)

---

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd spur-chat
```

Install backend dependencies:
```bash
cd backend
npm install
```

Install frontend dependencies:
```bash
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

#### Backend

```bash
cd backend
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux
```

Open `backend/.env` and fill in your API key:

```env
# Option A: Groq (FREE — recommended)
# Get your free key at https://console.groq.com
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxx

# Option B: Anthropic Claude (paid)
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx

# Server port (default: 3001)
PORT=3001

# Frontend URL for CORS (default: http://localhost:5173)
FRONTEND_URL=http://localhost:5173
```

> **Note:** The backend auto-detects which provider to use based on which key is present.
> If both are set, Groq takes priority (or set `LLM_PROVIDER=anthropic` to override).

#### Frontend

The frontend defaults to `http://localhost:3001` — no `.env` file needed unless your backend runs on a different port.

```bash
cd frontend
copy .env.example .env        # Windows
# cp .env.example .env        # Mac/Linux
```

```env
VITE_API_URL=http://localhost:3001
```

---

### 3. Set Up the Database

Run migrations to create the SQLite database and schema:

```bash
cd backend
npm run migrate
```

This creates `backend/data/chat.db` with the `conversations` and `messages` tables. It is safe to run multiple times (uses `CREATE TABLE IF NOT EXISTS`).

---

### 4. Start the Backend

```bash
cd backend
npm run dev
```

You should see:
```
✅ Migrations complete
[LLM] Provider: groq
[LLM] GROQ_API_KEY set: true
🚀 Spur Chat backend running on http://localhost:3001
```

> If `GROQ_API_KEY set: false`, your `.env` file is not being read. On Windows, check that the file is named `.env` and not `.env.txt` (enable file extensions in File Explorer → View → File name extensions).

---

### 5. Start the Frontend

Open a **second terminal**:

```bash
cd frontend
npm run dev
```

Then open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## Architecture Overview

### Project Structure

```
spur-chat/
├── backend/
│   ├── src/
│   │   ├── index.ts                  # Express app entry point
│   │   ├── routes/
│   │   │   └── chat.ts               # POST /chat/message, GET /chat/history/:id
│   │   ├── services/
│   │   │   └── llm.ts                # LLM abstraction (Groq + Anthropic)
│   │   ├── db/
│   │   │   ├── migrate.ts            # Schema creation & DB connection
│   │   │   └── repository.ts         # Data access layer (plain SQL)
│   │   └── middleware/
│   │       └── errorHandler.ts       # Global error + 404 handlers
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx                  # React entry point
│   │   ├── App.tsx                   # Root component, state management
│   │   ├── index.css                 # Global design tokens & reset
│   │   ├── vite-env.d.ts             # CSS module + Vite env type declarations
│   │   ├── components/
│   │   │   ├── Sidebar.tsx           # Brand sidebar + new chat button
│   │   │   ├── ChatHeader.tsx        # Agent info + online status
│   │   │   ├── MessageBubble.tsx     # User / AI / error message bubbles
│   │   │   ├── TypingIndicator.tsx   # Animated "agent is typing" dots
│   │   │   ├── ChatInput.tsx         # Auto-growing textarea + send button
│   │   │   └── Welcome.tsx           # Welcome screen with suggestion chips
│   │   ├── hooks/
│   │   │   └── useSession.ts         # localStorage session persistence hook
│   │   └── lib/
│   │       └── api.ts                # Typed fetch client for backend API
│   ├── index.html
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

### Backend Layers

The backend follows a clean separation of concerns:

| Layer | File | Responsibility |
|---|---|---|
| **Routes** | `routes/chat.ts` | HTTP parsing, input validation (Zod), response shaping |
| **Services** | `services/llm.ts` | LLM provider abstraction, prompt construction, error classification |
| **DB** | `db/repository.ts` | All database reads/writes, no business logic |
| **Middleware** | `middleware/errorHandler.ts` | Catches unhandled errors, returns clean JSON |

Each layer only knows about the layer below it. Routes call services and repositories. Services know nothing about HTTP. This makes each piece independently testable and replaceable.

---

### Frontend Structure

The React frontend is built with component-level CSS Modules for scoped styling and no external UI library. State lives entirely in `App.tsx` and flows down via props:

- **`App.tsx`** — owns all chat state (`messages`, `isLoading`, `showWelcome`), session management, and orchestrates API calls
- **`useSession`** hook — thin wrapper around `localStorage` for persisting `sessionId` across page refreshes
- **`api.ts`** — fully typed fetch client; handles timeouts and throws `Error` with a user-friendly message on failure
- All components are pure and presentational — they receive data and callbacks, they don't fetch or store anything

---

### Key Design Decisions

**Multi-provider LLM service.** `generateReply(history, userMessage)` is the single surface that knows about any LLM provider. Adding a new provider (OpenAI, Gemini, etc.) means adding one function inside `llm.ts` and a new `else if` branch — nothing else changes. Provider is selected at startup via environment variables, not at call time.

**Typed error classification.** The `LLMError` class carries a `code` field (`authentication` | `rate_limit` | `provider_error` | `timeout` | `unknown`). This means routes can make smart decisions (e.g. return 401 vs 503) without parsing error message strings.

**SQLite for zero-config local development.** `better-sqlite3` is synchronous and needs no connection pooling. All queries are standard SQL with no ORM — the only thing that would change when migrating to PostgreSQL is the `getDb()` function returning a `pg.Pool` instead.

**Session without auth.** `sessionId` is a UUID stored in `localStorage`. The backend creates a new conversation on first message and returns the ID. On reload, the frontend sends the stored ID and the backend fetches and returns the history. Stale or invalid IDs silently create a new session.

**Input validation at the boundary.** Zod validates every incoming request before anything touches the DB or LLM. Empty messages, oversized payloads, and malformed UUIDs are all rejected with structured `400` responses that include human-readable detail messages.

---

## LLM Notes

### Provider

The backend supports two providers, selected automatically based on which key is in `.env`:

| Provider | Model | Cost | Notes |
|---|---|---|---|
| **Groq** | `llama-3.1-8b-instant` | Free | Recommended for development |
| **Anthropic** | `claude-3-5-sonnet-20241022` | Paid | Higher quality responses |

To explicitly set a provider:
```env
LLM_PROVIDER=groq       # or: anthropic
```

---

### Prompting Strategy

The system prompt contains the full store knowledge base hardcoded inline:

- Shipping policy (rates, timelines, international)
- Return & refund policy (30 days, exceptions, process)
- Order management (cancellation window, tracking)
- Payment methods
- Support hours and contact email

The full conversation history (up to the last 20 messages) is sent with every request so the AI maintains context across multi-turn conversations. The new user message is always appended as the final turn.

Example prompt structure:
```
System: [Store knowledge base + tone guidelines]
User:    "What's your return policy?"
Assistant: "We offer 30-day hassle-free returns..."
User:    "What if the item is damaged?"   ← current message
```

---

### Cost Controls

| Control | Value | Purpose |
|---|---|---|
| `max_tokens` | 512 | Caps reply length; sufficient for support answers |
| `MAX_HISTORY_MESSAGES` | 20 | Limits context window size per request |
| `MAX_INPUT_CHARS` | 2000 | Validated at route level; rejected with 400 |
| Body size limit | 50kb | Set on Express `json()` middleware |

---

### Error Handling

Every LLM error is caught, classified, and returned as a clean JSON response — the app never crashes or returns a raw stack trace to the client.

| HTTP Status | Code | Cause |
|---|---|---|
| `400` | — | Empty message, message too long, invalid session UUID |
| `503` | `authentication` | Missing or invalid API key |
| `503` | `rate_limit` | Provider rate limit hit |
| `503` | `provider_error` | Provider 5xx error |
| `503` | `timeout` | Request timed out (30s client-side limit) |
| `503` | `unknown` | Unexpected error; full error logged server-side |

---

## Data Model

```sql
-- A conversation = one chat session
CREATE TABLE conversations (
  id         TEXT PRIMARY KEY,              -- UUID
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  metadata   TEXT                           -- JSON, reserved for future use
);

-- Every message in a conversation
CREATE TABLE messages (
  id              TEXT PRIMARY KEY,         -- UUID
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender          TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
  text            TEXT NOT NULL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at      ON messages(created_at);
```

On page reload, if a `sessionId` exists in `localStorage`, the frontend calls `GET /chat/history/:sessionId` and renders the full conversation history before the user types anything.

---

## API Reference

### `POST /chat/message`

Send a user message and receive an AI reply.

**Request body:**
```json
{
  "message": "What's your return policy?",
  "sessionId": "optional-uuid-for-existing-conversation"
}
```

**Success response `200`:**
```json
{
  "reply": "We offer 30-day hassle-free returns from the delivery date...",
  "sessionId": "3f2a1b4c-..."
}
```

**Error responses:**
```json
// 400 — Validation failed
{ "error": "Validation failed", "details": ["Message cannot be empty"] }

// 503 — LLM error
{ "error": "AI service error", "message": "Invalid Groq API key...", "code": "authentication" }
```

---

### `GET /chat/history/:sessionId`

Fetch the full message history for an existing conversation.

**Success response `200`:**
```json
{
  "sessionId": "3f2a1b4c-...",
  "messages": [
    {
      "id": "a1b2c3d4-...",
      "conversation_id": "3f2a1b4c-...",
      "sender": "user",
      "text": "What's your return policy?",
      "created_at": "2026-06-03T10:00:00.000Z"
    },
    {
      "id": "e5f6g7h8-...",
      "conversation_id": "3f2a1b4c-...",
      "sender": "ai",
      "text": "We offer 30-day hassle-free returns...",
      "created_at": "2026-06-03T10:00:01.000Z"
    }
  ]
}
```

**Error responses:**
```json
// 400 — Invalid session ID format
{ "error": "Invalid session ID" }

// 404 — Session not found
{ "error": "Conversation not found" }
```

### `GET /health`

Health check endpoint.

**Response `200`:**
```json
{ "status": "ok", "timestamp": "2026-06-03T10:00:00.000Z" }
```

---

## Trade-offs & If I Had More Time

### What I consciously left out

- **No Redis caching** — repeated identical questions (e.g. "what's your return policy?") hit the LLM every time. A simple cache keyed on a hash of the last N messages + current message would cut costs and latency significantly.
- **No streaming** — the AI reply appears all at once after the full response is generated. Streaming via SSE or WebSockets would make the experience feel much faster, especially for longer replies.
- **SQLite instead of PostgreSQL** — fine for local development and the scale of this exercise. The schema and repository layer are written in plain SQL specifically to make this a one-file swap when needed.
- **No auth** — as specified in the requirements. Would add session tokens or simple API-key-based auth for a multi-user deployment.
- **No rate limiting** — the `/chat/message` endpoint has no per-IP rate limit. Easy to add with `express-rate-limit`.
- **No Docker setup** — skipped in favour of focusing on code quality. Would add a `docker-compose.yml` for one-command local setup in production.

### With more time

- **Streaming responses** with `ReadableStream` on the backend and `EventSource` on the frontend
- **RAG-based knowledge base** — store FAQ documents in the DB, embed them, and retrieve relevant chunks per query rather than stuffing the entire knowledge base into every system prompt
- **Feedback mechanism** — thumbs up/down on AI responses to log quality and identify gaps in the knowledge base
- **Admin dashboard** — view all conversations, search by keyword, see error rates
- **Unit + integration tests** — especially for the LLM service (mock provider), repository layer (in-memory SQLite), and route validation
- **CI/CD pipeline** — GitHub Actions running `tsc --noEmit` and tests on every push
