# PowerShell test script for AI Emotional Memory Bank API

Write-Host "=== Testing AI Emotional Memory Bank APIs ===" -ForegroundColor Cyan
Write-Host ""

# Test health endpoints
Write-Host "1. Testing Health Endpoints..." -ForegroundColor Yellow
$services = @(
    @{Name="upload-service"; Port=8001},
    @{Name="emotion-service"; Port=8002},
    @{Name="timeline-service"; Port=8003},
    @{Name="search-service"; Port=8004},
    @{Name="admin-service"; Port=8005}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -UseBasicParsing -TimeoutSec 2
        Write-Host "✓ $($service.Name) is healthy" -ForegroundColor Green
    } catch {
        Write-Host "✗ $($service.Name) is not responding" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "2. Testing Admin Login..." -ForegroundColor Yellow
try {
    $body = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8005/admin/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Admin login successful" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0, [Math]::Min(20, $response.token.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Admin login failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan

