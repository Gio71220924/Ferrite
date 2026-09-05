# Start Ferrite Backend + Cloudflare Tunnel
# Run this script from the Ferrite root directory

Write-Host "Starting Ferrite backend server..." -ForegroundColor Cyan

# Start backend server in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location "G:\PersonalProject\Ferrite\server"
    npx tsx src/index.ts
}

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Check if backend is running
$backendRunning = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet
if (-not $backendRunning) {
    Write-Host "ERROR: Backend failed to start on port 3001" -ForegroundColor Red
    Stop-Job $backendJob
    exit 1
}

Write-Host "Backend running on port 3001" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Yellow
Write-Host ""

# Run cloudflared tunnel (foreground so user can see the URL)
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel --url http://localhost:3001

# When tunnel stops, also stop backend
Write-Host ""
Write-Host "Stopping backend server..." -ForegroundColor Yellow
Stop-Job $backendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -ErrorAction SilentlyContinue
Write-Host "Done." -ForegroundColor Green
