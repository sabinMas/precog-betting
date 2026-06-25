# Vercel deploy - run this from File Explorer: right-click → Run with PowerShell
Set-Location (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "`n=== Vercel Deploy ===" -ForegroundColor Cyan
Write-Host "Project: precog-betting" -ForegroundColor White
Write-Host "Team:    sabinmas-projects`n" -ForegroundColor White

# Install vercel CLI if missing
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "Deploying to Vercel (a browser will open to log in if needed)..." -ForegroundColor Yellow
vercel --prod --yes --name precog-betting --scope sabinmas-projects

Write-Host "`n=== Done! ===" -ForegroundColor Cyan
Write-Host "Set env vars at: https://vercel.com/sabinmas-projects/precog-betting/settings/environment-variables" -ForegroundColor White
Read-Host "`nPress Enter to close"
