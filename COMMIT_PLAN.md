# HealthyLife — CI/CD & Final Checkpoint Commit Plan

This plan organizes all work done for the **VPS Automated Deployment (CI/CD), MySQL Database Compatibility, Seeded Test Accounts, Policy Handbook PDF & Bot, and Navigation Updates** across the 4 team members.

---

## 👥 Team & Git Credentials

| Member | Roll | Git user.name | Git user.email | Role & Responsibilities |
|---|---|---|---|---|
| **aalvee-aarham** | 20230204085 | `aalvee-aarham` | `aalvee.aarham@gmail.com` | **Team Leader** · Issue creation, VPS CI/CD pipeline |
| **joya** | 20230204091 | `Joyaaa-91` | `rubaida.zakir17@gmail.com` | **Database Lead** · MySQL cross-driver compatibility |
| **ifftekhar** | 20230204079 | `iftekhar141879` | `iftekhar118332@gmail.com` | **Backend Lead** · Policy Bot, PDF service, Demo Seeders |
| **namira** | 20230204071 | `tsunaami` | `mojumdernamira@gmail.com` | **Integration Lead** · Frontend Policy Hub, Documentation & Branch Merges |

---

## 📋 GitHub Issues (Created by Team Leader `aalvee-aarham`)

The team leader will create the following 4 GitHub issues:

1. **Issue #28: Setup VPS Automated CI/CD Pipeline & Server Environment**
   - *Assignee:* `aalvee-aarham`
   - *Goal:* Create GitHub Actions deployment workflow for automated build, release bundling, SCP transfer to VPS (`s20230204085@187.52.122.100`), migration, and caching. Remove outdated Vercel configs.

2. **Issue #29: Implement Multi-Driver MySQL Database Compatibility Layer**
   - *Assignee:* `joya`
   - *Goal:* Implement `DbProcedure` and `DbHelper` drivers to support MySQL stored procedures, triggers, views, and raw queries alongside PostgreSQL.

3. **Issue #30: Implement Policy Bot Backend, PDF Delivery & Demo Seeders**
   - *Assignee:* `ifftekhar`
   - *Goal:* Seed standard demo accounts (`demo@demo.com`, `coach@demo.com`, `nutri@demo.com`), build `/api/policy/ask` with Groq AI fallback and keyword lookup, and serve the policy PDF at `/api/policy/pdf`.

4. **Issue #31: Build Frontend Policy Hub, Navigation & Update Documentation**
   - *Assignee:* `namira`
   - *Goal:* Build interactive `PolicyView` with section accordions, chatbot widget, and embedded PDF viewer. Add Policy to Navbar and Sidebar. Update `README.md`. Merge all member branches into `main`.

---

## 🌿 Feature Branches & Commit Distribution

Each member creates their designated branch from `main`, makes commits with short messages using their Git credentials, and opens a Pull Request.

### 1. aalvee-aarham — Branch: `ci/vps-deployment`
*Git commit command:* `git commit --author="aalvee-aarham <aalvee.aarham@gmail.com>" -m "..."`

| Commit # | Message | Affected Files / Changes |
|---|---|---|
| **C1** | `ci: add vps deploy workflow` | `.github/workflows/deploy.yml` (PHP 8.4 setup, Composer install, React build) |
| **C2** | `ci: configure scp and release bundle` | `.github/workflows/deploy.yml` (tar packaging, scp transfer, ssh deploy script) |
| **C3** | `chore: remove vercel config` | `.vercelignore`, `vercel.json`, `api/index.php`, `.gitignore` |

---

### 2. joya — Branch: `feature/mysql-db-support`
*Git commit command:* `git commit --author="Joyaaa-91 <rubaida.zakir17@gmail.com>" -m "..."`

| Commit # | Message | Affected Files / Changes |
|---|---|---|
| **C4** | `feat: add db helper and procedure callers` | `app/Support/DbHelper.php`, `app/Support/DbProcedure.php` |
| **C5** | `refactor: support mysql in migrations` | `0020_create_views.php`, `0021_create_procedures.php`, `0022_create_triggers.php`, `0013_...php` |
| **C6** | `refactor: adapt services for mysql` | `GymLogService.php`, `CoachService.php`, `PlanService.php`, `CycleService.php`, `MealService.php`, etc. |

---

### 3. ifftekhar — Branch: `feature/policy-bot-backend`
*Git commit command:* `git commit --author="iftekhar141879 <iftekhar118332@gmail.com>" -m "..."`

| Commit # | Message | Affected Files / Changes |
|---|---|---|
| **C7** | `feat: seed demo and coach accounts` | `database/seeders/DatabaseSeeder.php` (`demo@demo.com`, `coach@demo.com`, `nutri@demo.com`) |
| **C8** | `feat: add policy bot and pdf endpoints` | `PolicyBotController.php`, `routes/api.php`, `public/healthylife_policy_handbook.pdf` |
| **C9** | `feat: add meal scan cloudinary support` | `CloudinaryService.php`, `MealController.php`, `config/services.php` |

---

### 4. namira — Branch: `feature/policy-hub-frontend`
*Git commit command:* `git commit --author="tsunaami <mojumdernamira@gmail.com>" -m "..."`

| Commit # | Message | Affected Files / Changes |
|---|---|---|
| **C10** | `feat: add policy view and chat widget` | `frontend/src/components/views/PolicyView.tsx`, `types.ts` |
| **C11** | `feat: add policy to navbar and sidebar` | `Navbar.tsx`, `Sidebar.tsx`, `Header.tsx`, `App.tsx` |
| **C12** | `docs: update readme with vps and demo info` | `README.md` (live VPS site, CI/CD pipeline, demo accounts) |

---

## 🔀 Branch Merging (Handled by `namira`)

**namira** will merge all feature branches into `main` sequentially:

```bash
# 1. Merge CI/CD workflow
git checkout main
git merge --no-ff ci/vps-deployment -m "merge: ci/vps-deployment into main (#28)"

# 2. Merge MySQL compatibility
git merge --no-ff feature/mysql-db-support -m "merge: feature/mysql-db-support into main (#29)"

# 3. Merge Policy Bot Backend & Seeders
git merge --no-ff feature/policy-bot-backend -m "merge: feature/policy-bot-backend into main (#30)"

# 4. Merge Frontend Policy Hub & README
git merge --no-ff feature/policy-hub-frontend -m "merge: feature/policy-hub-frontend into main (#31)"
```

### Verification
Once merged:
- `main` and `final` will have identical codebase trees.
- `git diff main final` will return empty (zero differences).
- The CI/CD pipeline on `main` will deploy seamlessly to `http://healthylife.austattendance.online`.
