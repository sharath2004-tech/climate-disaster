#!/usr/bin/env pwsh

# ===================================================================
# MongoDB Atlas Connection Verification Script
# ===================================================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "MongoDB Atlas Connection Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "Please update .env with your MongoDB Atlas connection string:" -ForegroundColor Yellow
    Write-Host "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/climate-disaster" -ForegroundColor White
    exit 1
}

# Load .env file
$envContent = Get-Content ".env" -Raw
$mongoUri = ""

# Extract MONGODB_URI
if ($envContent -match "MONGODB_URI=(.+)") {
    $mongoUri = $matches[1].Trim()
}

Write-Host "Checking MongoDB configuration..." -ForegroundColor Yellow
Write-Host ""

if ([string]::IsNullOrEmpty($mongoUri)) {
    Write-Host "[ERROR] MONGODB_URI not found in .env file!" -ForegroundColor Red
    exit 1
}

# Check if it's MongoDB Atlas
if ($mongoUri -like "*mongodb+srv://*") {
    Write-Host "[OK] MongoDB Atlas connection detected" -ForegroundColor Green
    
    # Extract cluster info
    if ($mongoUri -match "@([^/]+)") {
        $cluster = $matches[1]
        Write-Host "    Cluster: $cluster" -ForegroundColor White
    }
    
    # Extract database name
    if ($mongoUri -match "/([^/?]+)") {
        $database = $matches[1]
        Write-Host "    Database: $database" -ForegroundColor White
    }
    
} elseif ($mongoUri -like "*mongodb://localhost*" -or $mongoUri -like "*mongodb://127.0.0.1*") {
    Write-Host "[WARNING] Local MongoDB detected!" -ForegroundColor Yellow
    Write-Host "You mentioned using MongoDB Compass (Atlas)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please update MONGODB_URI in .env to your Atlas connection string:" -ForegroundColor White
    Write-Host "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/climate-disaster" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "[INFO] Custom MongoDB connection detected" -ForegroundColor Cyan
    Write-Host "    URI: $mongoUri" -ForegroundColor White
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "[OK] Configuration looks good!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure MongoDB Atlas allows connections from your IP" -ForegroundColor White
Write-Host "2. Database should be named: climate-disaster (or update .env)" -ForegroundColor White
Write-Host "3. Run: docker-compose up --build" -ForegroundColor White
Write-Host ""
Write-Host "Both services (backend + pathway) will use the same database!" -ForegroundColor Green
