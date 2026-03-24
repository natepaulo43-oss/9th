# 9thform Production Deployment Script (PowerShell)
# This script deploys both backend and frontend to production

Write-Host "🚀 Starting 9thform Production Deployment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Deploy Backend to Firebase Functions
Write-Host "📦 Step 1: Deploying Backend to Firebase Functions..." -ForegroundColor Yellow
Set-Location backend
firebase deploy --only functions
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend deployed successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Build Frontend
Write-Host "🏗️  Step 2: Building Frontend..." -ForegroundColor Yellow
Set-Location ..\frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy Frontend to Netlify
Write-Host "🌐 Step 3: Deploying Frontend to Netlify..." -ForegroundColor Yellow
netlify deploy --prod --dir=build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure Stripe webhook with your production backend URL"
Write-Host "2. Test the order flow on your live site"
Write-Host "3. Visit /admin to verify the dashboard works"
Write-Host ""

Set-Location ..
