#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start the complete Guardian emergency response system
.DESCRIPTION
    Starts the AI Triage Service, Backend API, and provides instructions for the frontend
#>

Write-Host "🚀 Starting GuardianNet Emergency Response System" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green

# Check if we're in the Guardian directory
if (-not (Test-Path "backend" -PathType Container) -or -not (Test-Path "ai-triage-service" -PathType Container)) {
    Write-Host "❌ Please run this script from the Guardian project root directory" -ForegroundColor Red
    exit 1
}

# Check for required dependencies
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow

# Check if Python is available
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# Create .env file for backend if it doesn't exist
if (-not (Test-Path "backend\.env")) {
    Write-Host "📝 Creating backend .env file..." -ForegroundColor Yellow
    Copy-Item "backend\.env.example" "backend\.env"
    Write-Host "⚠️  Please edit backend\.env with your actual configuration" -ForegroundColor Yellow
}

Write-Host "`n🚀 Starting services..." -ForegroundColor Green

# Start AI Triage Service
Write-Host "`n1️⃣  Starting AI Triage Service..." -ForegroundColor Cyan
try {
    $aiServiceJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\ai-triage-service
        $env:GEMINI_API_KEY = Get-Content .env | Select-String "GEMINI_API_KEY=" | ForEach-Object { $_.ToString().Split("=")[1] }
        python run_service.py
    }
    Start-Sleep -Seconds 3
    
    # Test if AI service is running
    try {
        $healthCheck = Invoke-RestMethod -Uri "http://localhost:8001/health" -TimeoutSec 5
        if ($healthCheck.status -eq "healthy") {
            Write-Host "✅ AI Triage Service is running on port 8001" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  AI Triage Service may still be starting..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to start AI Triage Service: $_" -ForegroundColor Red
    exit 1
}

# Start Backend
Write-Host "`n2️⃣  Starting Backend API..." -ForegroundColor Cyan
try {
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\backend
        npm start
    }
    Start-Sleep -Seconds 5
    
    # Test if backend is running
    try {
        $backendHealth = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        Write-Host "✅ Backend API is running on port 3000" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Backend API may still be starting..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Failed to start Backend: $_" -ForegroundColor Red
    Get-Job | Remove-Job -Force
    exit 1
}

Write-Host "`n🎉 Guardian System Started Successfully!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green

Write-Host "`n📍 Service URLs:" -ForegroundColor White
Write-Host "   🤖 AI Triage Service: http://localhost:8001" -ForegroundColor Cyan
Write-Host "      └── Health: http://localhost:8001/health" -ForegroundColor Gray
Write-Host "      └── Docs:   http://localhost:8001/docs" -ForegroundColor Gray
Write-Host "   🏗️  Backend API:      http://localhost:3000" -ForegroundColor Cyan
Write-Host "      └── Health: http://localhost:3000/api/health" -ForegroundColor Gray

Write-Host "`n🖥️  To start the frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm start" -ForegroundColor Gray

Write-Host "`n📊 Monitoring:" -ForegroundColor White
Write-Host "   AI Triage Job ID: $($aiServiceJob.Id)" -ForegroundColor Gray
Write-Host "   Backend Job ID:   $($backendJob.Id)" -ForegroundColor Gray

Write-Host "`n⏹️  To stop all services:" -ForegroundColor White
Write-Host "   Press Ctrl+C or run: Get-Job | Remove-Job -Force" -ForegroundColor Gray

Write-Host "`n🔧 Troubleshooting:" -ForegroundColor White
Write-Host "   1. Check your .env files are properly configured" -ForegroundColor Gray
Write-Host "   2. Ensure MongoDB is running for the backend" -ForegroundColor Gray
Write-Host "   3. Verify your GEMINI_API_KEY is set correctly" -ForegroundColor Gray

# Keep the script running and monitor jobs
Write-Host "`n⏳ Services are running. Press Ctrl+C to stop..." -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Check if jobs are still running
        $jobs = Get-Job
        if ($jobs.Count -lt 2) {
            Write-Host "⚠️  One or more services have stopped!" -ForegroundColor Yellow
            break
        }
    }
} finally {
    Write-Host "`n🛑 Stopping all services..." -ForegroundColor Yellow
    Get-Job | Remove-Job -Force
    Write-Host "👋 Guardian system stopped." -ForegroundColor Green
}