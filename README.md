# HealthyLife — Holistic Health, Fitness & Coaching Platform

A production full-stack holistic wellness platform featuring a React + Vite frontend running on a Laravel 12 API with dual MySQL 8 / PostgreSQL support. HealthyLife combines AI-powered nutrition tracking, workout planning, biological cycle syncing, and multi-role portals for members and coaches.

**Live Deployments:**
- **Secure HTTPS (SSL):** [https://cycle-scientific-deviant-max.trycloudflare.com](https://cycle-scientific-deviant-max.trycloudflare.com)
- **Official Lab HTTP:** [http://healthylife.austattendance.online](http://healthylife.austattendance.online)

---

## 🚀 Key Features

- **AI Food Logger & Image Scanner** — Natural language meal logging and food recognition via Groq/Gemini & Cloudinary, with automated image previews.
- **Macro & Water Tracker** — Real-time tracking for Calories, Protein, Carbs, Fats, and daily hydration goals.
- **Workouts & Sculpt Log** — Gym session logger with exercise sets, reps, weight, PR tracking, and workout history.
- **CycleSync™ Phase Tracker** — Biological cycle tracking with hormonal alignment, symptom logging, and phase-specific recommendations.
- **AI Health Advisor** — Dual-provider intelligence (Groq Llama-3.3-70b / Gemini) for personalized fitness advice.
- **Coach & Client Portal** — Dedicated coach dashboard, client adherence monitoring, 1-on-1 messaging, and customized plan assignment.
- **Policy Handbook & Policy Bot** — In-app policy reader with embedded PDF handbook viewer and real-time AI Policy Bot for membership, refund, and coaching inquiries.
- **Auth & Access Control** — Email/password & Google Firebase authentication with Laravel Sanctum multi-role API tokens.

---

## 👥 Demo Test Accounts

The live system is pre-seeded with test accounts for immediate evaluation:

| Email | Password | Role | Description |
|---|---|---|---|
| `demo@demo.com` | `password` | **Member** | Active member account with pre-filled meals, workout logs & hydration |
| `coach@demo.com` | `password` | **Coach** | Fitness Coach profile (`Alex Rivera, CSCS`) with active client rosters |
| `nutri@demo.com` | `password` | **Coach** | Nutrition Specialist profile (`Dr. Elena Chen`) with client consultations |

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons
- **Backend:** Laravel 12 (PHP 8.4), Laravel Sanctum
- **Database:** MySQL 8 / PostgreSQL 16 (stored procedures, views, triggers, and transactions)
- **Deployment & Hosting:** VPS (Ubuntu 24.04, Nginx, PHP 8.4-FPM)
- **CI/CD Pipeline:** GitHub Actions automated deployment on push to `main`
- **AI & External APIs:** Groq API, Google Gemini, Cloudinary, Pexels API, Firebase Auth

---

## 🗄️ Database Architecture (Stored Logic)

HealthyLife employs database-level business logic across migrations:
- **Views:** `v_gym_logs_with_sets`, `v_workout_stats`, `v_client_adherence`, `v_daily_intake`
- **Stored Procedures:** `sp_log_workout`, `sp_assign_coach`, `sp_toggle_symptom`, `sp_log_period`
- **Triggers:** `trg_gym_logs_uncheck_plan_item`, `trg_plans_archive_previous`, `trg_cycle_periods_close_previous`, `trg_meals_uncheck_plan_item`
- **Transactions:** Atomic transactions for user registration, coach switching, workout deletion, and chat initiation.

---

## 🚢 CI/CD Deployment Workflow

Every push to the `main` branch automatically triggers our GitHub Actions pipeline (`.github/workflows/deploy.yml`):
1. **PHP 8.4 Environment:** Configures PHP extensions (`pdo`, `pdo_mysql`, `mbstring`, `xml`, `bcmath`).
2. **Backend Dependencies:** Installs production Composer packages with optimized autoloading.
3. **Frontend Build:** Installs Node modules and compiles the React SPA directly into Laravel's public asset directory.
4. **Release Bundle:** Packages a clean tarball excluding dev files and git metadata.
5. **Secure SCP Transfer:** Deploys the release bundle and policy assets directly to the VPS via SSH key authentication.
6. **Server Automation:** Extracts files, sets permissions for `www-data`, runs `migrate --force`, seeds database records, refreshes route & configuration caches, and restarts workers.

---

## ⚙️ Running Locally

### Prerequisites
- Node.js 20+ & npm
- PHP 8.4 (with `pdo_mysql` or `pdo_pgsql`) & Composer
- MySQL 8.0+ or PostgreSQL 16+

### Setup Steps
```bash
# 1. Install root & frontend dependencies
npm install

# 2. Install backend dependencies
cd packages/backend
composer install
cp .env.example .env

# 3. Configure .env with your DB credentials & AI keys
php artisan key:generate
php artisan migrate --seed
cd ../..

# 4. Start local development server
npm run dev
```

---

## 👥 Development Team

| Roll | Member | GitHub | Responsibility |
|---|---|---|---|
| **20230204085** | **Aalvee Aarham** | [@Aalvee-Aarham](https://github.com/Aalvee-Aarham) | Team Lead, CI/CD Pipeline & VPS Deployment |
| **20230204071** | **Farhana Mojumder Namira** | [@tsunaami](https://github.com/tsunaami) | Frontend Policy Hub & Integration Lead |
| **20230204091** | **Rubaida Zakir Joya** | [@Joyaaa-91](https://github.com/Joyaaa-91) | MySQL Database Compatibility & Procedures |
| **20230204079** | **Iftekhar** | [@iftekhar141879](https://github.com/iftekhar141879) | Policy Bot Backend, PDF Delivery & Seeders |
