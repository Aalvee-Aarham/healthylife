# HealthyLife — Holistic Health, Fitness & Coaching Platform

A full-stack holistic wellness platform: a React + Vite frontend on a Laravel + PostgreSQL API. HealthyLife combines AI-powered nutrition tracking, workout planning, cycle syncing, and multi-role portals for members and coaches.

**Live:** https://web-production-8d9bf4.up.railway.app

---

## 🚀 Features

- **AI Food Logger** — Log meals via natural language. Auto-fetches food images via Pexels API.
- **Macro & Water Tracker** — Visual progress rings for Calories, Protein, Carbs, Fats, and hydration.
- **Workouts & Sculpt** — Daily training schedules with muscle group targeting and PR logging.
- **CycleSync™** — 28-day biological phase tracker with symptom logging and phase-specific recommendations.
- **AI Health Advisor** — Groq (Llama-3.3-70b) or Gemini, switchable via `AI_PROVIDER`.
- **Coach Portal** — Client roster, chat, plans, and AI workout plan generator.
- **Auth** — Email/password or Google sign-in (Firebase), backed by Laravel Sanctum tokens.
- **Light / Dark Mode** — Full Organic Tech design system with glassmorphic UI.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide
- **Backend:** Laravel 12 (PHP 8.2), Sanctum
- **Database:** PostgreSQL 16 (views, procedures, and triggers live in migrations)
- **Auth:** Firebase Authentication (Google) + Sanctum
- **AI:** Groq / Gemini
- **Images:** Pexels API
- **Hosting:** Railway

---

## 📁 Structure

```
packages/
  frontend/   React SPA (calls the API at relative /api)
  backend/    Laravel API
Dockerfile    Production image: builds the SPA into Laravel's public/ (Railway)
docker-compose.yml   Local dev stack: Postgres + backend + frontend
```

---

## ⚙️ Run Locally

### Option A — Docker (recommended)

```bash
cp docker.env.example .env      # add GROQ_API_KEY / GEMINI_API_KEY
docker compose up --build
```

Frontend at `http://localhost:3000`, API at `http://localhost:8000`. Migrations run automatically.

### Option B — Native

Requires Node 20+, PHP 8.2+ (with `pdo_pgsql`), Composer, and PostgreSQL.

```bash
npm install
cd packages/backend
composer install
cp .env.example .env            # set DB_* and AI keys
php artisan key:generate
php artisan migrate
cd ../..
npm run dev                     # starts backend (:8000) and frontend (:3000)
```

### Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `APP_KEY` | backend | Laravel encryption key |
| `DB_URL` or `DB_HOST`/`DB_PORT`/`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD` | backend | PostgreSQL connection |
| `AI_PROVIDER` | backend | `groq` or `gemini` |
| `GROQ_API_KEY` / `GEMINI_API_KEY` / `GEMINI_MODEL` | backend | AI provider credentials |
| `FIREBASE_API_KEY` | backend | Optional — defaults to the project's public web key; used to verify Firebase ID tokens |
| `VITE_PEXELS_API_KEY` | frontend (build time) | Food/workout images |

---

## 🚢 Deployment (Railway)

The Railway project `healthylife` has three services:

- **`web`** — built from the root `Dockerfile`. One container serves both the API (`/api/*`) and the SPA (everything else). Migrations run on each boot.
- **`Postgres`** — Railway Postgres; `web` connects via `DB_URL=${{Postgres.DATABASE_URL}}`.
- **`policy-bot`** — the landing-page policy chatbot. It runs `rag-demo/rag_demo.ipynb` (RAG over the policy handbook) and serves it privately; `web` calls it via `RAG_API_URL=http://policy-bot.railway.internal:8001`. See [rag-demo/README.md](rag-demo/README.md).

Deploy from your machine:

```bash
railway link          # select the healthylife project
railway up --service web
railway up ./rag-demo --path-as-root --service policy-bot
```

`web` service variables: `APP_KEY`, `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL`, `DB_CONNECTION=pgsql`, `DB_URL`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=file`, `CACHE_STORE=file`, `LOG_CHANNEL=stderr`, the AI keys above, and `VITE_PEXELS_API_KEY` (passed to the frontend build).

**Firebase:** any new domain (e.g. a custom domain) must be added under Firebase console → Authentication → Settings → Authorized domains, or Google sign-in fails with `auth/unauthorized-domain`.

---

## 👥 Team

| Role | Member | GitHub |
|------|--------|--------|
| Team Lead | Aalvee Aarham | [@Aalvee-Aarham](https://github.com/Aalvee-Aarham) |
| Developer | Farhana Mojumder Namira | [@tsunaami](https://github.com/tsunaami) |
| Developer | Rubida Zakir Joya | [@Joyaaa-91](https://github.com/Joyaaa-91) |
| Developer | Iftekhar | [@iftekhar141879](https://github.com/iftekhar141879) |
