# HealthyLife Dev Script - Starts PostgreSQL, Laravel (backend), and Vite (frontend) together

$PHP = "C:\Users\User\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
$POSTGRES = "C:\Program Files\PostgreSQL\17\bin\postgres.exe"
$POSTGRES_DATA = "C:\Program Files\PostgreSQL\17\data"
$BACKEND_DIR = Join-Path $PSScriptRoot "backend"

Write-Host ""
Write-Host "  HealthyLife Dev Server" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray

# 1. Start PostgreSQL if not already running on port 5432
$pgPortCheck = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
$pgProc = $null

if (-not $pgPortCheck) {
    if (Test-Path $POSTGRES) {
        Write-Host "  Starting PostgreSQL database..." -ForegroundColor DarkCyan
        $pgProc = Start-Process -FilePath $POSTGRES -ArgumentList "-D", "`"$POSTGRES_DATA`"" -PassThru -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host "  PostgreSQL started on port 5432." -ForegroundColor Green
    } else {
        Write-Host "  [WARN] PostgreSQL executable not found at default path. Ensure DB is running." -ForegroundColor Yellow
    }
} else {
    Write-Host "  PostgreSQL is already active on port 5432." -ForegroundColor Green
}

# 2. Verify PHP exists
if (-not (Test-Path $PHP)) {
    Write-Host "  [ERROR] PHP not found at: $PHP" -ForegroundColor Red
    Write-Host "  Please update the `$PHP path in dev.ps1" -ForegroundColor Yellow
    exit 1
}

$phpVersion = & $PHP --version 2>&1 | Select-Object -First 1
Write-Host "  PHP        : $phpVersion" -ForegroundColor Green

# 3. Start Laravel backend
Write-Host "  Starting Laravel backend on http://localhost:8000 ..." -ForegroundColor DarkCyan
$backendProc = Start-Process -FilePath $PHP -ArgumentList "artisan", "serve", "--host=0.0.0.0", "--port=8000" `
    -WorkingDirectory $BACKEND_DIR `
    -PassThru `
    -WindowStyle Minimized

Write-Host "  Backend PID: $($backendProc.Id)" -ForegroundColor DarkGray

# Give Laravel a moment to boot
Start-Sleep -Seconds 2

# 4. Start Vite frontend in foreground (Ctrl+C stops everything)
Write-Host "  Starting Vite frontend on http://localhost:3000 ..." -ForegroundColor DarkCyan
Write-Host ""
Write-Host "  Press Ctrl+C to stop all servers." -ForegroundColor Yellow
Write-Host ""

try {
    npm run dev
} finally {
    Write-Host ""
    Write-Host "  Stopping backend (PID $($backendProc.Id))..." -ForegroundColor Red
    if ($backendProc -and -not $backendProc.HasExited) {
        Stop-Process -Id $backendProc.Id -Force -ErrorAction SilentlyContinue
    }
    # Clean up any orphaned php artisan serve processes
    Get-Process -Name "php" -ErrorAction SilentlyContinue | 
        Where-Object { $_.CommandLine -like "*artisan*" } | 
        Stop-Process -Force -ErrorAction SilentlyContinue
}
