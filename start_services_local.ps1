# PowerShell script to start all services locally on Windows
# This script starts all microservices in separate windows

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Starting AI Personal Memory Bank Services (Local Mode)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{name="upload-service"; port=8001; script="upload-service\run_local.py"},
    @{name="emotion-service"; port=8002; script="emotion-service\run_local.py"},
    @{name="timeline-service"; port=8003; script="timeline-service\run_local.py"},
    @{name="search-service"; port=8004; script="search-service\run_local.py"},
    @{name="admin-service"; port=8005; script="admin-service\run_local.py"}
)

foreach ($service in $services) {
    $scriptPath = Join-Path $PSScriptRoot $service.script
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "[ERROR] $($service.name): Script not found at $scriptPath" -ForegroundColor Red
        continue
    }
    
    Write-Host "Starting $($service.name) on port $($service.port)..." -ForegroundColor Yellow
    
    # Start in a new window
    Start-Process python -ArgumentList $scriptPath -WindowStyle Normal
    
    Write-Host "[OK] $($service.name) started" -ForegroundColor Green
    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "All services started!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running on:" -ForegroundColor Cyan
foreach ($service in $services) {
    Write-Host "  $($service.name): http://localhost:$($service.port)" -ForegroundColor White
}
Write-Host ""
Write-Host "Close the service windows to stop them" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan
