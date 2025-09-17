# GuardianNet ML Service Startup Script
Write-Host "Starting GuardianNet ML Service..." -ForegroundColor Green

# Set working directory
Set-Location "C:\Users\sriam\Guardian\ml_service"

# Check if port 8000 is available
$port = 8000
$connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue

if ($connection.TcpTestSucceeded) {
    Write-Host "Port $port is already in use. Stopping existing service..." -ForegroundColor Yellow
    # Find and kill process using port 8000
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($process) {
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Start the ML service
Write-Host "Starting ML service on port $port..." -ForegroundColor Green
try {
    # Use Start-Process to run in background
    $process = Start-Process -FilePath "uvicorn" -ArgumentList "app:app --host 0.0.0.0 --port $port --log-level info" -PassThru -WindowStyle Hidden
    
    # Wait a moment for service to start
    Start-Sleep -Seconds 3
    
    # Test if service is running
    $testConnection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    
    if ($testConnection.TcpTestSucceeded) {
        Write-Host "✅ ML Service started successfully!" -ForegroundColor Green
        Write-Host "   - Service URL: http://localhost:$port" -ForegroundColor Cyan
        Write-Host "   - Health check: http://localhost:$port/health" -ForegroundColor Cyan
        Write-Host "   - Process ID: $($process.Id)" -ForegroundColor Gray
        
        # Test health endpoint
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$port/health" -Method Get -TimeoutSec 5
            Write-Host "   - Health Status: $($response.status)" -ForegroundColor Green
        } catch {
            Write-Host "   - Health check failed, but service appears to be running" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Failed to start ML service" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error starting ML service: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}