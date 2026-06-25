# Kalshi Research Assistant — One-click deploy script
# Run from PowerShell in the project directory:
#   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
#   .\deploy.ps1

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

Write-Host "`n=== Kalshi Research Assistant Deploy ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectDir`n"

# ── 1. Git setup ─────────────────────────────────────────────────────────────
Write-Host "1. Setting up Git..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    git init -b main
    Write-Host "   Git repo initialized" -ForegroundColor Green
} else {
    Write-Host "   Git repo already exists" -ForegroundColor Green
}

git config user.email "masonsabin@gmail.com"
git config user.name "Mason Sabin"

git add -A
git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m "Kalshi Research Assistant: Market scanner, combo lab, parlay builder"
    Write-Host "   Committed changes" -ForegroundColor Green
} else {
    Write-Host "   Nothing new to commit" -ForegroundColor Gray
}

# ── 2. GitHub repo ────────────────────────────────────────────────────────────
Write-Host "`n2. Creating GitHub repo..." -ForegroundColor Yellow

$ghExists = Get-Command gh -ErrorAction SilentlyContinue
if ($ghExists) {
    # Try with gh CLI
    $repoExists = gh repo view sabinMas/precog-betting 2>$null
    if (-not $repoExists) {
        gh repo create sabinMas/precog-betting --public --source=. --remote=origin --push
        Write-Host "   GitHub repo created and pushed" -ForegroundColor Green
    } else {
        git remote remove origin 2>$null
        git remote add origin https://github.com/sabinMas/precog-betting.git
        git branch -M main
        git push -u origin main --force
        Write-Host "   Pushed to existing GitHub repo" -ForegroundColor Green
    }
} else {
    Write-Host "   GitHub CLI (gh) not found. Trying git push directly..." -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin https://github.com/sabinMas/precog-betting.git
    git branch -M main
    git push -u origin main --force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   Pushed to GitHub" -ForegroundColor Green
    } else {
        Write-Host "   Could not push to GitHub. Create the repo at https://github.com/new" -ForegroundColor Red
        Write-Host "   Repo name: precog-betting, then re-run this script" -ForegroundColor Red
    }
}

# ── 3. Vercel deploy ──────────────────────────────────────────────────────────
Write-Host "`n3. Deploying to Vercel..." -ForegroundColor Yellow

$vercelExists = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelExists) {
    Write-Host "   Installing Vercel CLI..." -ForegroundColor Gray
    npm install -g vercel
}

Write-Host "   Running vercel deploy (you may need to log in)..." -ForegroundColor Gray
vercel --yes --prod --name precog-betting

Write-Host "`n=== Deploy complete! ===" -ForegroundColor Cyan
Write-Host "GitHub: https://github.com/sabinMas/precog-betting" -ForegroundColor White
Write-Host "Add env variables in Vercel dashboard: https://vercel.com/sabinmas-projects" -ForegroundColor White
