# HealthyLife Dev Script - Starts frontend (Vite) and backend (Laravel) together

Write-Host "Starting HealthyLife development servers..." -ForegroundColor Cyan

# Start Laravel backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PSScriptRoot\backend"
    php artisan serve --host=0.0.0.0 --port=8000
}

Write-Host "Backend (Laravel) starting on http://localhost:8000" -ForegroundColor Green

# Give backend a moment to start
Start-Sleep -Seconds 2

# Start Vite frontend (foreground, so Ctrl+C stops everything)
try {
    Write-Host "Frontend (Vite) starting on http://localhost:3000" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop all servers.`n" -ForegroundColor Yellow
    npm run dev
} finally {
    Write-Host "`nStopping backend..." -ForegroundColor Red
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
}
