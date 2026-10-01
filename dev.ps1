# HealthyLife Dev Script - Starts PostgreSQL, Laravel (backend), the policy chatbot, and Vite (frontend) together

$PHP = 'C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe'
$POSTGRES = 'C:\Program Files\PostgreSQL\17\bin\postgres.exe'
$POSTGRES_DATA = 'C:\Program Files\PostgreSQL\17\data'
$BACKEND_DIR = Join-Path $PSScriptRoot 'packages\backend'

Write-Host ''
Write-Host '  HealthyLife Dev Server' -ForegroundColor Cyan
Write-Host '  -----------------------------------------' -ForegroundColor DarkGray

# 1. Start PostgreSQL if not already running on port 5432
$pgPortCheck = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue

if (-not $pgPortCheck) {
    if (Test-Path $POSTGRES) {
        Write-Host '  Starting PostgreSQL database...' -ForegroundColor DarkCyan
        Start-Process -FilePath $POSTGRES -ArgumentList '-D', "`"$POSTGRES_DATA`"" -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host '  PostgreSQL started on port 5432.' -ForegroundColor Green
    } else {
        Write-Host '  [WARN] PostgreSQL executable not found at default path. Ensure DB is running.' -ForegroundColor Yellow
    }
} else {
    Write-Host '  PostgreSQL is already active on port 5432.' -ForegroundColor Green
}

# 2. Verify PHP exists
if (-not (Test-Path $PHP)) {
    Write-Host '  [ERROR] PHP not found at: ' $PHP -ForegroundColor Red
    Write-Host '  Please update the $PHP path in dev.ps1' -ForegroundColor Yellow
    exit 1
}

$phpVersion = & $PHP --version 2>&1 | Select-Object -First 1
Write-Host "  PHP        : $phpVersion" -ForegroundColor Green

# 3. Start Laravel backend
Write-Host '  Starting Laravel backend on http://localhost:8000 ...' -ForegroundColor DarkCyan
$backendProc = Start-Process -FilePath $PHP -ArgumentList 'artisan', 'serve', '--host=0.0.0.0', '--port=8000' -WorkingDirectory $BACKEND_DIR -PassThru -WindowStyle Minimized

Write-Host "  Backend PID: $($backendProc.Id)" -ForegroundColor DarkGray

# Wait until Laravel accepts connections, else Vite's first /api calls fail with ECONNREFUSED
$deadline = (Get-Date).AddSeconds(30)
while (-not (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Milliseconds 500
}

# 4. Start the policy chatbot: runs rag-demo\rag_demo.ipynb headless; its API is ready on :8001 after ~1 min
$RAG_DIR = Join-Path $PSScriptRoot 'rag-demo'
$JUPYTER = Join-Path $RAG_DIR '.venv\Scripts\jupyter.exe'
$ragProc = $null

if (Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue) {
    Write-Host '  Policy chatbot is already running on port 8001.' -ForegroundColor Green
} elseif (Test-Path $JUPYTER) {
    Write-Host '  Starting policy chatbot (rag_demo.ipynb), ready on http://localhost:8001 in ~1 min ...' -ForegroundColor DarkCyan
    $env:KEEP_API_RUNNING = '1'
    $ragProc = Start-Process -FilePath $JUPYTER -ArgumentList 'execute', 'rag_demo.ipynb' -WorkingDirectory $RAG_DIR -PassThru -WindowStyle Minimized
    Remove-Item Env:KEEP_API_RUNNING
    Write-Host "  Chatbot PID: $($ragProc.Id)" -ForegroundColor DarkGray
} else {
    Write-Host '  [WARN] rag-demo\.venv not found, policy chatbot skipped (setup: rag-demo\README.md).' -ForegroundColor Yellow
}

# 5. Start Vite frontend in foreground (Ctrl+C stops everything)
Write-Host '  Starting Vite frontend on http://localhost:3000 ...' -ForegroundColor DarkCyan
Write-Host ''
Write-Host '  Press Ctrl+C to stop all servers.' -ForegroundColor Yellow
Write-Host ''

try {
    # Frontend only: the backend is already running (root `npm run dev` would start a 2nd Laravel on :8001).
    # cd instead of `npm --prefix <path>`: npm runs via cmd.exe, which splits the path at the "&" in the folder name.
    Push-Location $PSScriptRoot
    npm run dev:frontend
} finally {
    Pop-Location
    Write-Host ''
    Write-Host '  Stopping backend and chatbot...' -ForegroundColor Red
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    if ($ragProc -and -not $ragProc.HasExited) {
        # /T also stops the notebook's Python kernel, which holds port 8001
        taskkill /PID $ragProc.Id /T /F | Out-Null
    }
    Get-Process -Name 'php' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
