[English](README.md) | [Português (Brasil)](README.pt-BR.md)

# MyTuDo — Local-First Personal Super-App

A modern, elegant, and Local-First personal management platform engineered as a high-performance, self-sovereign hub for daily routines, academic knowledge, and cultural entertainment. The application operates with 0ms latency directly inside the browser using IndexedDB (Dexie.js), installs seamlessly as a Progressive Web App (PWA) across mobile and desktop environments, and synchronizes user state via Google Drive API v3 and Google Calendar API v3, backed by a minimalist Next.js 14 Serverless Backend-for-Frontend (BFF) for credential protection and Artificial Intelligence routing.

---

## Application Modules

### 1. Task Management & Kanban Boards
- Rich task list featuring prioritization, subtasks, deadlines, and dynamic categorical labels.
- Temporal Kanban (Deadlines) and Categorical Kanban (Tags) with Drag & Drop interaction powered by `@dnd-kit/core` (calibrated for mouse precision and touch sensors).
- Semantic task classification and tag suggestions powered by the AI Triumvirate (v9.3) with background asynchronous execution and non-intrusive feedback.

### 2. Hybrid Calendar (Google Calendar Engine)
- Direct bidirectional synchronization via Google Calendar API v3 supporting multiple calendars and custom Google color mappings.
- Event expansion and recurring tasks powered by the `rrule.js` engine.
- Isolated local cache within the `gc_cache` Dexie table, preventing payload bloating in the primary Google Drive sync file.

### 3. Knowledge & Study Workspace (Split-Pane)
- Integrated desktop split-pane workspace with a custom TipTap rich text editor on the left pane and a Google Drive document/scan explorer on the right pane, supporting subfolders and breadcrumb navigation.
- Academic editor equipped with interactive grid table generators, floating images with fluid Text-Wrap, and attachment cards featuring an in-place PDF Lightbox viewer—maintaining zero binary blobs inside the local database.

### 4. Cultural Entertainment Shelf & Metadata
- Unified media tracking for movies, TV series, anime, manga, video games, and books across three interchangeable view modes: Large Cards, Compact Icons, and Detailed List (Windows Explorer style), persisted in local storage.
- Comprehensive metadata fetching via TMDB (with Portuguese morphological query normalization), RAWG (up to 8 candidate results and compound-term resolution with Lazy Fetching), AniList GraphQL, and Google Books (with an in-memory 15-minute Circuit Breaker and Open Library fallback).
- In-depth detail modal presenting category-specific media DNA (dynamic Metacritic badges, studios, directors, platforms, ISBN), 1-click ceiling sync, and automatic season roll-over on the `+1` progression button.

### 5. Quick Memories
- Fast thought and note capture organized in a responsive masonry grid with full Markdown rendering and plain text import/export routines.

---

## AI-Assisted Engineering Methodology & Governance

MyTuDo development adheres to structured AI-assisted software engineering practices, steered by the `ai-memory` context governance framework (Fábio Akita) and driven by dedicated Agent Skills within the Google Antigravity IDE.

### Development Agents Timeline

| Period | Architecture & Leadership | Tactical Execution Layer | Milestones Delivered |
| :--- | :--- | :--- | :--- |
| **Initial Phases (1 to 7)** | Gemini 3.1 Pro | Gemini 3.5 Flash | Local-First foundation (Dexie.js), Google Drive LWW sync (`useSync.ts`), PWA setup (`@serwist/next`), Kanbans (`@dnd-kit`), and Hybrid Calendar (Google Calendar API v3 & `rrule.js`). |
| **Intermediate Phase (8 to v9.2.3)** | Gemini 3.1 Pro | Gemini 3.8 Flash | Migration to Gemini 3.8 Flash for code execution. Split-Pane Study Workspace (TipTap & Google Drive Readonly) and cultural metadata integration (TMDB, RAWG, AniList GraphQL, Google Books). |
| **Audit & Governance Milestone (Oct 28, 2026)** | Gemini 4 Argon | Gemini 3.8 Flash | Comprehensive 7-Pillar Audit (AppSec, LGPD/ToS compliance, Phase 12 APK readiness, sync concurrency). Implantation of the `ai-memory` pattern and squadron of 6 Agent Skills in `.agents/skills/`. |
| **Milestone v9.3.0 (Oct 30, 2026)** | Gemini 3.8 Flash | Gemini 3.8 Flash | UI/UX refinements, floating button Viewport Clamping, automatic season roll-over, metadata Circuit Breaker, and AI Triumvirate Task Auto-Tagging engine. |

### Technical Governance Structure

- `Controle/MEMORIA_IA.md`: Core invariants, Dexie schema rules, and prohibited anti-patterns.
- `Controle/DECISOES_ARQUITETURAIS.md`: Formal Architectural Decision Records (ADRs 001 to 013).
- `Controle/ESTADO_ATUAL.md`: Session handoff state and immediate execution queue.
- `Controle/AUDITORIA_E_EVOLUCAO_V9.md`: Comprehensive technical audit report.
- `Requisitos/BACKLOG_FUTURO_IDEIAS.md`: Ideas repository preserved for future releases.

---

## Credentials Ecosystem & External APIs

Private server keys omit the `NEXT_PUBLIC_` prefix and reside strictly inside the Next.js server environment (`.env.local` / Vercel Secrets), never exposed to the client-side bundle.

### 1. Google Cloud Platform (GCP)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: OAuth 2.0 Web Client ID for user authentication across `drive.appdata`, `drive.readonly`, and `calendar.events` scopes.
- `GOOGLE_CLIENT_SECRET`: Server secret consumed by `/api/auth/token` and `/api/auth/refresh` for authorization code exchange and silent refresh tokens.
- `NEXT_PUBLIC_GOOGLE_API_KEY`: API key restricted exclusively to the Google Picker API inside GCP Console, consumed in the study module (`useGooglePicker.ts`).
- `NEXT_PUBLIC_SYNC_FILE_NAME`: Suffix for the Drive app data file (`sync_dev.json` in local development vs `sync.json` in production).

### 2. Cultural Metadata APIs
- `TMDB_API_KEY`: Consumed by `/api/metadata/tmdb` for localized Portuguese movie and TV series queries with morphological fallback.
- `RAWG_API_KEY`: Consumed by `/api/metadata/games` on-demand via Lazy Fetching (1 search query returning up to 8 candidate games and 1 detail query upon user selection).
- AniList GraphQL: Direct client-side GraphQL queries for anime and manga at `https://graphql.anilist.co`.
- Google Books & Open Library: Public client-side queries for book cataloging with an in-memory Circuit Breaker against rate limits.

### 3. Canonical AI Triumvirate (Application Runtime — v9.3+)

| Provider | Environment Variable | Canonical Model Slug | Primary Role |
| :--- | :--- | :--- | :--- |
| **Google AI Studio** | `GEMINI_API_KEY` | `gemini-3.8-flash` | Primary semantic intelligence provider with native structured JSON Schema enforcement. |
| **DeepSeek Platform** | `DEEPSEEK_API_KEY` | `deepseek-flash` | Secondary logical contingency fallback and analytical reasoning. |
| **Groq Cloud** | `GROQ_API_KEY` | `llama-3.3-70b-versatile` | Ultra-low latency emergency fallback operating in JSON Object mode. |

---

## Core Technologies

- **Framework:** Next.js 14 (App Router) + React 18 + TypeScript.
- **Local Database:** Dexie.js (IndexedDB) + `dexie-react-hooks`.
- **Text Editor:** TipTap (ProseMirror) with custom node extensions.
- **Calendar & Recurrence:** `react-big-calendar` + `rrule.js` + `date-fns`.
- **Drag and Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`.
- **PWA & Offline Cache:** `@serwist/next`.

---

## Local Installation & Setup

```bash
git clone <https://github.com/DanHuon/My-TuDo>
cd MyTuDo
npm install
npm run dev
```

Access the application locally at [http://localhost:3000](http://localhost:3000).
