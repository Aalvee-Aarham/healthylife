#!/usr/bin/env bash
# =============================================================================
# HealthyLife — Feature Branch Organizer (Option B: Fast-Forward / Rebase Merge)
# =============================================================================
# Organizes modified files across 4 feature branches with 4 focused commits
# each, using simple commit messages (< 7 words), matching author/committer
# identities to ensure a single GitHub profile badge, and merges linearly into main.
# =============================================================================

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

BASE_COMMIT="364fc811d6c8f5b22171efc08bc14c0a02bcb4e6"
SOURCE_REF="backup-main"

# Helper to commit with identical author and committer metadata
make_commit() {
  local author_name="$1"
  local author_email="$2"
  local commit_date="$3"
  local commit_msg="$4"

  git config user.name "$author_name"
  git config user.email "$author_email"

  GIT_AUTHOR_NAME="$author_name" \
  GIT_AUTHOR_EMAIL="$author_email" \
  GIT_COMMITTER_NAME="$author_name" \
  GIT_COMMITTER_EMAIL="$author_email" \
  GIT_AUTHOR_DATE="$commit_date" \
  GIT_COMMITTER_DATE="$commit_date" \
  git commit -m "$commit_msg"
}

echo "=== Starting Feature Branch Organization ==="

# =============================================================================
# 1. Feature Branch: feature/gym-ai-agent (Joyaaa-91)
# =============================================================================
echo "--> Creating feature/gym-ai-agent..."
git checkout -B feature/gym-ai-agent "$BASE_COMMIT"

# Commit 1.1 (Sep 3, 10:00 AM)
git checkout "$SOURCE_REF" -- \
  packages/backend/app/Http/Controllers/GymLogController.php \
  packages/backend/app/Services/GymLogService.php
make_commit "Joyaaa-91" "Joyaaa-91@users.noreply.github.com" \
  "2026-09-03T10:00:00+06:00" "feat: implement gym log controller"

# Commit 1.2 (Sep 4, 11:00 AM)
git checkout "$SOURCE_REF" -- \
  packages/backend/app/Http/Controllers/AIController.php \
  packages/backend/app/Services/AI/AIService.php \
  packages/backend/app/Services/AI/AIProviderInterface.php
make_commit "Joyaaa-91" "Joyaaa-91@users.noreply.github.com" \
  "2026-09-04T11:00:00+06:00" "feat: scaffold AI service layer"

# Commit 1.3 (Sep 4, 04:00 PM)
git checkout "$SOURCE_REF" -- \
  packages/backend/app/Services/AI/GeminiProvider.php \
  packages/backend/app/Services/AI/GroqProvider.php \
  packages/backend/app/Providers/AIServiceProvider.php \
  packages/backend/config/services.php
make_commit "Joyaaa-91" "Joyaaa-91@users.noreply.github.com" \
  "2026-09-04T16:00:00+06:00" "feat: configure AI service providers"

# Commit 1.4 (Sep 5, 11:00 AM)
git checkout "$SOURCE_REF" -- \
  packages/frontend/src/components/views/WorkoutsView.tsx \
  packages/frontend/src/components/views/AIAssistantView.tsx \
  packages/frontend/src/services/groqApi.ts
make_commit "Joyaaa-91" "Joyaaa-91@users.noreply.github.com" \
  "2026-09-05T11:00:00+06:00" "feat: connect workouts and AI views"

echo "  OK: feature/gym-ai-agent completed (4 commits)"

# =============================================================================
# 2. Feature Branch: feature/ai-plan-gen (Aalvee-Aarham)
# =============================================================================
echo "--> Creating feature/ai-plan-gen..."
git checkout -B feature/ai-plan-gen feature/gym-ai-agent

# Commit 2.1 (Sep 3, 09:30 AM)
git checkout "$SOURCE_REF" -- \
  packages/backend/database/migrations/0016_create_meal_presets_table.php \
  packages/backend/database/migrations/0017_create_plans_table.php \
  packages/backend/database/migrations/0018_create_plan_completions_table.php \
  packages/backend/database/migrations/0019_add_log_links_to_plan_completions_table.php
make_commit "Aalvee-Aarham" "Aalvee-Aarham@users.noreply.github.com" \
  "2026-09-03T09:30:00+06:00" "feat: add plan database migrations"

# Commit 2.2 (Sep 3, 03:00 PM)
git checkout "$SOURCE_REF" -- \
  packages/backend/app/Http/Controllers/MealPlanController.php \
  packages/backend/app/Services/MealPlanService.php \
  packages/backend/app/Http/Controllers/MealPresetController.php \
  packages/backend/app/Services/MealPresetService.php
make_commit "Aalvee-Aarham" "Aalvee-Aarham@users.noreply.github.com" \
  "2026-09-03T15:00:00+06:00" "feat: add meal plan controllers"

# Commit 2.3 (Sep 4, 11:00 AM)
git checkout "$SOURCE_REF" -- \
  packages/backend/app/Http/Controllers/PlanController.php \
  packages/backend/app/Services/PlanService.php
make_commit "Aalvee-Aarham" "Aalvee-Aarham@users.noreply.github.com" \
  "2026-09-04T11:00:00+06:00" "feat: implement AI plan generation"

# Commit 2.4 (Sep 5, 09:00 AM)
git checkout "$SOURCE_REF" -- \
  packages/frontend/src/components/views/PlanView.tsx \
  packages/frontend/src/components/nutrition/MealPresetsSection.tsx
make_commit "Aalvee-Aarham" "Aalvee-Aarham@users.noreply.github.com" \
  "2026-09-05T09:00:00+06:00" "feat: build plan view frontend"

echo "  OK: feature/ai-plan-gen completed (4 commits)"

# =============================================================================
# 3. Feature Branch: feature/frontend (iftekhar141879)
# =============================================================================
echo "--> Creating feature/frontend..."
git checkout -B feature/frontend feature/ai-plan-gen

# Commit 3.1 (Sep 3, 10:00 AM)
git checkout "$SOURCE_REF" -- \
  packages/frontend/src/index.css \
  packages/frontend/src/types.ts \
  packages/frontend/src/components/ui/Badge.tsx \
  packages/frontend/src/components/ui/Button.tsx \
  packages/frontend/src/components/ui/Card.tsx \
  packages/frontend/src/components/ui/Skeleton.tsx
make_commit "iftekhar141879" "iftekhar141879@users.noreply.github.com" \
  "2026-09-03T10:00:00+06:00" "feat: add UI design tokens"

# Commit 3.2 (Sep 3, 04:00 PM)
git checkout "$SOURCE_REF" -- \
  packages/frontend/src/App.tsx \
  packages/frontend/src/components/Navbar.tsx \
  packages/frontend/src/components/Sidebar.tsx \
  packages/frontend/src/components/Header.tsx \
  packages/frontend/src/components/Footer.tsx
make_commit "iftekhar141879" "iftekhar141879@users.noreply.github.com" \
  "2026-09-03T16:00:00+06:00" "feat: update app navigation shell"

# Commit 3.3 (Sep 4, 09:00 AM)
git checkout "$SOURCE_REF" -- \
  packages/frontend/src/components/views/DashboardView.tsx \
  packages/frontend/src/components/dashboard/TodaysFocusCard.tsx \
  packages/frontend/src/components/FindCoachModal.tsx \
  packages/frontend/src/components/AuthModal.tsx
make_commit "iftekhar141879" "iftekhar141879@users.noreply.github.com" \
  "2026-09-04T09:00:00+06:00" "feat: update dashboard components"

# Commit 3.4 (Sep 5, 01:00 PM)
git checkout "$SOURCE_REF" -- \
  packages/frontend/src/components/views/LandingView.tsx \
  packages/frontend/src/components/views/SignInView.tsx \
  packages/frontend/src/components/views/SignUpView.tsx
git rm -f \
  packages/frontend/src/components/views/auth/CoachSignIn.tsx \
  packages/frontend/src/components/views/auth/UserSignIn.tsx
make_commit "iftekhar141879" "iftekhar141879@users.noreply.github.com" \
  "2026-09-05T13:00:00+06:00" "feat: update auth and landing views"

echo "  OK: feature/frontend completed (4 commits)"

# =============================================================================
# 4. Feature Branch: feature/system-core (tsunaami)
# =============================================================================
echo "--> Creating feature/system-core..."
git checkout -B feature/system-core feature/frontend

# Commit 4.1 (Sep 3, 08:00 AM)
git checkout "$SOURCE_REF" -- \
  packages/backend/app/Http/Controllers/AuthController.php \
  packages/backend/app/Services/AuthService.php \
  packages/backend/app/Http/Controllers/CoachController.php \
  packages/backend/app/Services/CoachService.php \
  packages/backend/database/migrations/0013_expand_roles_and_specialties_check.php \
  packages/backend/database/migrations/0014_add_medical_fields_to_users_table.php
make_commit "tsunaami" "tsunaami@users.noreply.github.com" \
  "2026-09-03T08:00:00+06:00" "feat: implement auth and coach system"

# Commit 4.2 (Sep 3, 12:00 PM)
git checkout "$SOURCE_REF" -- \
  packages/backend/app/Http/Controllers/MealController.php \
  packages/backend/app/Services/MealService.php \
  packages/backend/app/Http/Controllers/WaterLogController.php \
  packages/backend/app/Services/WaterLogService.php \
  packages/backend/app/Http/Controllers/ChatController.php \
  packages/backend/app/Services/ChatService.php \
  packages/backend/database/migrations/0015_add_source_to_meals_table.php
make_commit "tsunaami" "tsunaami@users.noreply.github.com" \
  "2026-09-03T12:00:00+06:00" "feat: add nutrition and chat backend"

# Commit 4.3 (Sep 4, 01:00 PM)
git checkout "$SOURCE_REF" -- \
  packages/backend/app/Http/Controllers/CycleController.php \
  packages/backend/app/Services/CycleService.php \
  packages/backend/app/Http/Controllers/DashboardController.php \
  packages/backend/app/Services/DashboardService.php \
  packages/backend/routes/api.php \
  packages/backend/database/seeders/DatabaseSeeder.php \
  packages/backend/bootstrap/providers.php \
  packages/backend/config/database.php
git rm -f \
  packages/backend/database/migrations/0007_create_sessions_table.php \
  packages/backend/database/migrations/0008_create_cache_table.php
make_commit "tsunaami" "tsunaami@users.noreply.github.com" \
  "2026-09-04T13:00:00+06:00" "feat: add cycle tracker and routes"

# Commit 4.4 (Sep 5, 03:00 PM)
git checkout "$SOURCE_REF" -- \
  .gitignore \
  packages/backend/.env.example \
  packages/frontend/src/services/api.ts \
  packages/frontend/src/hooks/useDashboard.ts \
  packages/frontend/src/hooks/useConversationPolling.ts \
  packages/frontend/src/components/views/NutritionView.tsx \
  packages/frontend/src/components/views/CycleTrackerView.tsx \
  packages/frontend/src/components/views/ChatView.tsx \
  packages/frontend/src/components/views/CoachDashboardView.tsx
git rm -f \
  packages/frontend/src/components/views/CoachView.tsx \
  packages/frontend/src/components/views/WaterView.tsx \
  packages/frontend/src/data/mockData.ts
make_commit "tsunaami" "tsunaami@users.noreply.github.com" \
  "2026-09-05T15:00:00+06:00" "chore: wire frontend data layer"

echo "  OK: feature/system-core completed (4 commits)"

# =============================================================================
# Merge Option B: Fast-Forward into main
# =============================================================================
echo "--> Merging all branches into main via fast-forward (Option B)..."
git checkout main
git reset --hard "$BASE_COMMIT"
git merge --ff-only feature/system-core

echo ""
echo "=== Done! All 4 branches organized and merged cleanly into main ==="
git log -16 --format="%h | %an <%ae> | %ad | %s"
