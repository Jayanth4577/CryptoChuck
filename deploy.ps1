#!/usr/bin/env pwsh
# CryptoChuck Deployment Script
# Run this script from the project root to deploy to Vercel

Write-Host "🐔 CryptoChuck Deployment Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "frontend/package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Build verification
Write-Host "📦 Step 1: Building frontend..." -ForegroundColor Yellow
Set-Location frontend

try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✅ Build successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed. Please fix build errors first." -ForegroundColor Red
    Set-Location ..
    exit 1
}

Write-Host ""

# Step 2: Ask for deployment confirmation
Write-Host "🚀 Step 2: Ready to deploy to production" -ForegroundColor Yellow
$deploy = Read-Host "Deploy to Vercel now? (y/n)"

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
    
    # Check if Vercel CLI is installed
    $vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
    
    if (-not $vercelInstalled) {
        Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
        npm install -g vercel
    }
    
    # Deploy
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Deployment successful!" -ForegroundColor Green
        Write-Host "🌐 Your site is live at: https://crypto-chuck.vercel.app" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Visit your site and test functionality" -ForegroundColor White
        Write-Host "  2. Connect MetaMask to Sepolia network" -ForegroundColor White
        Write-Host "  3. Test minting and gameplay" -ForegroundColor White
    } else {
        Write-Host "❌ Deployment failed. Check the errors above." -ForegroundColor Red
    }
} else {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
}

Set-Location ..
Write-Host ""
Write-Host "Done! 🎉" -ForegroundColor Green
