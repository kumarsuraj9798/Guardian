#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick development start for Guardian system
#>

Write-Host "🚀 Starting Guardian Development Environment" -ForegroundColor Green

# Navigate to AI Triage Service and start it in a new window
Write-Host "Starting AI Triage Service..." -ForegroundColor Cyan
$aiServiceArgs = "-NoExit", "-Command", "cd ai-triage-service; `$env:GEMINI_API_KEY='AIzaSyAnYCstsqR7QYZZm6nHI_uDBE9LZh_avzo'; python run_service.py"
Start-Process "powershell" -ArgumentList $aiServiceArgs

# Wait a moment for the AI service to start
Start-Sleep -Seconds 3

# Navigate to backend and start it in a new window  
Write-Host "Starting Backend API..." -ForegroundColor Cyan
$backendArgs = "-NoExit", "-Command", "cd backend; npm start"
Start-Process "powershell" -ArgumentList $backendArgs

Write-Host "`n✅ Services starting in separate windows:" -ForegroundColor Green
Write-Host "   🤖 AI Triage Service: http://localhost:8001" -ForegroundColor White
Write-Host "   🏗️  Backend API: http://localhost:3000" -ForegroundColor White
Write-Host "`nTo start frontend: cd frontend && npm start" -ForegroundColor Yellow