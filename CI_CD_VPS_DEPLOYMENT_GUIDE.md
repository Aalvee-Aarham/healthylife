# Comprehensive Guide: CI/CD Deployment with GitHub Actions to VPS

This guide documents the complete, step-by-step process used to build, configure, and automate the deployment of the **HealthyLife** platform to an Ubuntu VPS running Nginx, PHP 8.4-FPM, and MySQL 8.

---

## 🏗️ Architecture Overview

The deployment follows a strict continuous delivery model where **zero compilation or dependency installation occurs on the VPS**:

```
[ Developer Laptop ]
        │  git push origin main
        ▼
[ GitHub Actions Runner (Ubuntu Latest) ]
   1. Setup PHP 8.4 + Extensions
   2. composer install --no-dev --optimize-autoloader  --> packages/backend/vendor/
   3. npm ci && npm run build                        --> packages/backend/public/app/
   4. tar -czf release.tar.gz .
   5. scp release.tar.gz to VPS
   6. ssh to unpack & run migrations
        │  SCP & SSH
        ▼
[ VPS (187.52.122.100) ]
   • Lives in: ~/laravel
   • Nginx root: /home/s20230204085/laravel/public
   • PHP 8.4-FPM Socket: /run/php/php8.4-fpm-s20230204085.sock
   • Database: MySQL 8 (healthylife_db)
   • Official Lab URL (HTTP): http://healthylife.austattendance.online
   • Secure Live URL (HTTPS): https://cycle-scientific-deviant-max.trycloudflare.com
```

---

## 🔑 Phase 1: SSH Key Authentication Setup

GitHub Actions needs passwordless, automated SSH access to the VPS.

### 1. Generate SSH Key Pair Locally
In PowerShell / Bash on your laptop:
```bash
# Generate a dedicated Ed25519 or 4096-bit RSA deploy key
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy" -f s20230204085 -N ""
```
This generates two files:
- `s20230204085` (Private Key — goes into GitHub Secrets)
- `s20230204085.pub` (Public Key — goes onto the VPS)

### 2. Copy the Public Key to the VPS
```bash
# Append the public key to the remote authorized_keys file
type s20230204085.pub | ssh s20230204085@187.52.122.100 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 3. Verify Local SSH Connection
```bash
ssh -i s20230204085 -o StrictHostKeyChecking=no s20230204085@187.52.122.100 "whoami"
# Output should return: s20230204085
```

### 4. Add Private Key to GitHub Repository Secrets
Using the GitHub CLI (`gh`):
```bash
# Read private key into GitHub Secrets as SSH_PRIVATE_KEY
gh secret set SSH_PRIVATE_KEY < s20230204085
```

---

## 🖥️ Phase 2: One-Time VPS & Server Configuration

Log in to the server via SSH:
```bash
ssh -i s20230204085 s20230204085@187.52.122.100
```

### 1. Database Creation (MySQL 8)
Access MySQL on the server:
```bash
mysql -u s20230204085 -p
```
Run the SQL queries:
```sql
CREATE DATABASE IF NOT EXISTS healthylife_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON healthylife_db.* TO 's20230204085'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Base Directories & Persistent `.env`
On the server, releases overwrite files in `~/laravel`. To prevent losing `.env` during builds, keep a master copy at `~/.env`:

```bash
# Create target laravel directories
mkdir -p ~/laravel/storage/app/policy
mkdir -p ~/laravel/storage/framework/{sessions,views,cache}
mkdir -p ~/laravel/bootstrap/cache

# Create master .env in the home directory
cat << 'EOF' > ~/.env
APP_NAME=HealthyLife
APP_ENV=production
APP_KEY=base64:7wT8o1kU5e0J3mQ9aX2zL4vB6nC8dE0fG2hJ4kL6mN8=
APP_DEBUG=false
APP_URL=http://healthylife.austattendance.online

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=healthylife_db
DB_USERNAME=s20230204085
DB_PASSWORD=<YOUR_MYSQL_PASSWORD>

BROADCAST_CONNECTION=log
CACHE_STORE=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

AI_PROVIDER=groq
GROQ_API_KEY=<YOUR_GROQ_API_KEY>
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
EOF

# Copy it into place
cp -f ~/.env ~/laravel/.env
```

### 3. File Permissions and ACL for Nginx (`www-data`)
Nginx runs as user `www-data` and needs read access to `~/laravel/public`, while the deploy user needs write access:
```bash
# Grant www-data traverse permissions on home directory
setfacl -m u:www-data:x ~
setfacl -m u:www-data:x ~/laravel

# Grant www-data read & execute permissions on the public directory
setfacl -R -m u:www-data:rX -m d:u:www-data:rX ~/laravel/public

# Ensure the user has write access to storage and cache
chmod -R u+rwX ~/laravel/storage ~/laravel/bootstrap/cache
```

### 4. Nginx Server Block Configuration
The Nginx virtual host at `/etc/nginx/sites-enabled/healthylife.austattendance.online`:
```nginx
server {
    listen 80;
    server_name healthylife.austattendance.online;
    root /home/s20230204085/laravel/public;
    index index.php;

    access_log /var/log/nginx/s20230204085-access.log;
    error_log  /var/log/nginx/s20230204085-error.log;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.4-fpm-s20230204085.sock;
    }

    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

---

## 📦 Phase 3: Project Code Setup (Vite & Laravel Integration)

The project is structured with both frontend and backend packages in a monorepo.

### 1. Frontend Build Target: `packages/frontend/vite.config.ts`
Vite is configured to compile static assets directly into Laravel's public asset directory (`public/app/`):
```typescript
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    base: '/app/',
    build: {
      outDir: '../backend/public/app',
      emptyOutDir: true,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
```

### 2. Laravel Fallback Route: `packages/backend/routes/web.php`
When a user navigates to any URL other than `/api/*`, Laravel serves the compiled React single-page app:
```php
<?php

use Illuminate\Support\Facades\Route;

// Serve the built React app for every non-API path
Route::get('/{any?}', fn () => response()->file(public_path('app/index.html')))
    ->where('any', '(?!api/|up$).*');
```

---

## 🤖 Phase 4: The CI/CD Pipeline (`.github/workflows/deploy.yml`)

The GitHub Actions workflow automates the entire process on every push to `main`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  DEPLOY_USER: s20230204085
  DEPLOY_HOST: 187.52.122.100

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Step 1: Check out repository
      - name: Get the code
        uses: actions/checkout@v4

      # Step 2: Set up PHP 8.4 matching VPS
      - name: Use PHP 8.4, same as the server
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          extensions: pdo, pdo_mysql, mbstring, xml, ctype, curl, bcmath

      # Step 3: Install PHP dependencies on GitHub Actions runner
      - name: Install the PHP packages
        run: |
          cd packages/backend
          composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

      # Step 4: Set up Node.js
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'

      # Step 5: Build React SPA into backend/public/app
      - name: Build the React app
        run: |
          npm ci
          npm run build --workspace @healthy-life/frontend
          test -f packages/backend/public/app/index.html || (echo "public/app/index.html missing!" && exit 1)

      # Step 6: Create release tarball containing code, vendor/, and public/app/
      - name: Pack the release
        run: |
          cd packages/backend
          tar --exclude='.git' --exclude='node_modules' --exclude='.env' --exclude='.env.*' -czf ../../release.tar.gz .
          cd ../..
          tar -tf release.tar.gz | grep "public/app/index.html" || (echo "public/app/index.html missing from release!" && exit 1)
          tar -tf release.tar.gz | grep "vendor/" || (echo "vendor missing from release!" && exit 1)

      # Step 7: Load SSH deploy key
      - name: Load the deploy key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "$DEPLOY_HOST" >> ~/.ssh/known_hosts

      # Step 8: Copy release bundle to VPS via SCP
      - name: Copy the release with scp
        run: |
          scp -i ~/.ssh/deploy_key release.tar.gz "$DEPLOY_USER@$DEPLOY_HOST:~/"
          scp -i ~/.ssh/deploy_key rag-demo/data/healthylife_policy_handbook.pdf "$DEPLOY_USER@$DEPLOY_HOST:~/healthylife_policy_handbook.pdf"

      # Step 9: Deploy and configure server via SSH
      - name: Deploy on the server
        run: |
          ssh -i ~/.ssh/deploy_key "$DEPLOY_USER@$DEPLOY_HOST" bash -s << 'ENDSSH'
          set -e
          mkdir -p ~/laravel
          tar -xzf ~/release.tar.gz -C ~/laravel
          chmod -R u+rwX ~/laravel/storage ~/laravel/bootstrap/cache
          mkdir -p ~/laravel/storage/framework/{views,cache,sessions}
          mkdir -p ~/laravel/storage/app/policy
          cp -f ~/healthylife_policy_handbook.pdf ~/laravel/storage/app/policy/healthylife_policy_handbook.pdf
          setfacl -m u:www-data:x ~ ~/laravel 2>/dev/null || true
          setfacl -R -m u:www-data:rX -m d:u:www-data:rX ~/laravel/public 2>/dev/null || true
          cp -f ~/.env ~/laravel/.env
          cd ~/laravel
          php artisan config:cache
          php artisan route:cache
          php artisan migrate --force
          php artisan db:seed --force
          php artisan storage:link 2>/dev/null || true
          rm -f ~/release.tar.gz ~/healthylife_policy_handbook.pdf
          ENDSSH
```

---

## 🔍 Phase 5: Debugging & Critical Gotchas Solved

### 1. PHP `open_basedir` Restriction
* **Problem:** In `PolicyBotController.php`, calling `file_exists(base_path('../../rag-demo/...'))` traversed above `/home/s20230204085` to `/home`, triggering a fatal `ErrorException: open_basedir restriction in effect`.
* **Fix:** Prioritize `storage_path('app/policy/...')` and `public_path('...')`, avoiding parent path traversal:
  ```php
  $candidates = [
      storage_path('app/policy/healthylife_policy_handbook.pdf'),
      public_path('healthylife_policy_handbook.pdf'),
      base_path('healthylife_policy_handbook.pdf'),
  ];
  foreach ($candidates as $path) {
      try {
          if (@file_exists($path) && is_file($path)) {
              return response()->file($path, [
                  'Content-Type' => 'application/pdf',
                  'Content-Disposition' => 'inline; filename="healthylife_policy_handbook.pdf"',
              ]);
          }
      } catch (\Throwable $e) {}
  }
  ```

### 2. Environment Variables & Caching
* **Problem:** When `php artisan config:cache` runs, `env()` returns `null` outside configuration files.
* **Fix:** All service keys (`GROQ_API_KEY`, `GEMINI_API_KEY`) are defined inside `config/services.php` and accessed via `config('services.groq.key')`.

### 3. Preserving `.env` Across Deployments
* **Problem:** `tar -xzf release.tar.gz -C ~/laravel` can overwrite or erase local configs.
* **Fix:** Kept a permanent master copy at `~/.env` and re-applied it with `cp -f ~/.env ~/laravel/.env` during the SSH unpack step before caching configs.

---

## ✅ Phase 6: Automated End-to-End Verification

After deployment, test the site using this verification script:

```javascript
// verify_live.js
const host = 'http://healthylife.austattendance.online';

async function verify() {
  console.log('=== 1. Testing PDF Endpoint ===');
  const pdfRes = await fetch(host + '/api/policy/pdf');
  console.log('Status:', pdfRes.status, '| Type:', pdfRes.headers.get('content-type'), '| Size:', pdfRes.headers.get('content-length'));

  console.log('\n=== 2. Testing Policy Bot Q&A ===');
  const askRes = await fetch(host + '/api/policy/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ question: 'What is the refund policy for annual plans?' })
  });
  const askData = await askRes.json();
  console.log('Status:', askRes.status);
  console.log('Answer:', askData.answer);

  console.log('\n=== 3. Testing Seeded Accounts Login ===');
  for (const email of ['demo@demo.com', 'coach@demo.com', 'nutri@demo.com']) {
    const loginRes = await fetch(host + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email, password: 'password' })
    });
    const loginData = await loginRes.json();
    console.log(email, '-> HTTP', loginRes.status, '| Name:', loginData.user?.name, '| Role:', loginData.user?.role, '| Token:', Boolean(loginData.token));
  }

  console.log('\n=== 4. Testing Frontend Page ===');
  const htmlRes = await fetch(host + '/');
  const html = await htmlRes.text();
  console.log('HTTP:', htmlRes.status, '| Contains root:', html.includes('root'));
}

verify().catch(console.error);
```

Run locally:
```bash
node verify_live.js
```

Expected Output:
```
=== 1. Testing PDF Endpoint ===
Status: 200 | Type: application/pdf | Size: 9444

=== 2. Testing Policy Bot Q&A ===
Status: 200
Answer: For annual plans, you can receive a full refund if you request it within 14 days of purchase and no coaching sessions have been used...

=== 3. Testing Seeded Accounts Login ===
demo@demo.com -> HTTP 200 | Name: Demo User | Role: member | Token: true
coach@demo.com -> HTTP 200 | Name: Alex Rivera, CSCS | Role: coach | Token: true
nutri@demo.com -> HTTP 200 | Name: Dr. Elena Chen | Role: coach | Token: true

=== 4. Testing Frontend Page ===
HTTP: 200 | Contains root: true
```
