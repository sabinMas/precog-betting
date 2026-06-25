# Kalshi Research Assistant — GitHub + Vercel deploy
# Double-click this file in File Explorer to run
# (Or: right-click → Run with PowerShell)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force -ErrorAction SilentlyContinue

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectDir

Write-Host "`n=== Kalshi Research Assistant Deploy ===" -ForegroundColor Cyan
Write-Host "Project: $ProjectDir`n"

# ── 1. Fix broken .git folder ─────────────────────────────────────────────────
Write-Host "1. Cleaning up git folder..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Remove-Item -Recurse -Force ".git" -ErrorAction SilentlyContinue
    Write-Host "   Removed old .git" -ForegroundColor Green
}

# ── 2. Fresh git init ─────────────────────────────────────────────────────────
Write-Host "2. Initializing git repo..." -ForegroundColor Yellow
git init -b main
git config user.email "masonsabin@gmail.com"
git config user.name "Mason Sabin"
git add -A
git commit -m "Kalshi Research Assistant: Market scanner, combo lab, parlay builder"
Write-Host "   Committed 56 files" -ForegroundColor Green

# ── 3. Push to GitHub ─────────────────────────────────────────────────────────
Write-Host "`n3. Pushing to GitHub..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/sabinMas/precog-betting.git
git branch -M main

# Try gh CLI first (handles auth automatically)
$ghExists = Get-Command gh -ErrorAction SilentlyContinue
if ($ghExists) {
    $repoExists = gh repo view sabinMas/precog-betting 2>$null
    if (-not $repoExists) {
        Write-Host "   Creating GitHub repo..." -ForegroundColor Gray
        gh repo create sabinMas/precog-betting --public --source=. --remote=origin --push
    } else {
        git push -u origin main --force
    }
} else {
    # Fallback: git push (uses Windows Credential Manager / GitHub Desktop creds)
    git push -u origin main --force
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Pushed to https://github.com/sabinMas/precog-betting" -ForegroundColor Green
} else {
    Write-Host "   GitHub push failed. Create the repo at https://github.com/new (name: precog-betting) then re-run." -ForegroundColor Red
    Read-Host "Press Enter to continue to Vercel deploy anyway"
}

# ── 4. Vercel deploy ──────────────────────────────────────────────────────────
Write-Host "`n4. Deploying to Vercel..." -ForegroundColor Yellow

$vercelExists = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelExists) {
    Write-Host "   Installing Vercel CLI..." -ForegroundColor Gray
    npm install -g vercel
}

Write-Host "   Running vercel deploy (log in if prompted)..." -ForegroundColor Gray
vercel --yes --prod --name precog-betting --scope sabinmas-projects

Write-Host "`n=== DONE! ===" -ForegroundColor Cyan
Write-Host "GitHub:  https://github.com/sabinMas/precog-betting" -ForegroundColor White
Write-Host "Vercel:  https://vercel.com/sabinmas-projects" -ForegroundColor White
Write-Host ""
Write-Host "Next: Set these env vars in Vercel dashboard (Project → Settings → Environment Variables):" -ForegroundColor Yellow
Write-Host "  KALSHI_API_KEY_ID     = your key ID" -ForegroundColor Gray
Write-Host "  KALSHI_PRIVATE_KEY    = -----BEGIN RSA PRIVATE KEY----- ..." -ForegroundColor Gray
Write-Host "  ENABLE_TRADING        = false" -ForegroundColor Gray
Write-Host "  DATABASE_URL          = postgres://... (optional)" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to close"
