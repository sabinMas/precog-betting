# precog-betting — Project Context for Claude Code

## What this is
A prediction market research web app using the Kalshi API. Next.js 15 App Router + TypeScript + Tailwind v4 dark theme. Deployed to Vercel under team `sabinmas-projects`.

## Current deployment status
- GitHub: https://github.com/sabinMas/precog-betting
- Vercel project: `prj_ju1KQoPI4fugy3nmdnVZGyYQKwro` (team: `sabinmas-projects`, `team_VHhpC2h6PATrqqQlIaUTUf1H`)
- **Blocker (as of 2026-06-25):** Vercel is rejecting deploys with ERROR state due to CVE-2025-66478 (CVSS 10.0 RCE in Next.js 15.3.3). Fix is already applied in `package.json` — `next` and `eslint-config-next` bumped to `15.3.6` — but the commit has NOT been pushed yet.
- **Next action:** `git add package.json && git commit -m "fix: upgrade next.js to 15.3.6 to patch CVE-2025-66478" && git push origin main` — this will trigger Vercel to auto-redeploy and should reach READY state.

## Key architectural decisions
- **Mock fallback:** All Kalshi API routes fall back to 8 hardcoded mock markets when the API is unavailable. App is fully usable without credentials.
- **Read-only by default:** `ENABLE_TRADING=false` env var. No trade execution anywhere in the app.
- **RSA-PSS signing is server-side only** (`src/lib/kalshi/auth.ts`) — private key never touches the browser.
- **Prisma is optional** — routes degrade gracefully if `DATABASE_URL` is not set. Build script is `prisma generate && next build` to avoid PrismaClientInitializationError on Vercel.
- **ESLint disabled during builds** (`eslint.ignoreDuringBuilds: true` in `next.config.ts`) — worked around a module resolution bug in eslint-config-next on Vercel.

## Scoring model (composite market score)
- spreadScore 25% + liquidityScore 30% + volumeScore 30% + momentumScore 15%

## Combo/parlay logic
- Independence-assumption combo probability with correlation risk detection
- UI at `/combo-lab` — ticker input, leg cards, side toggle, user prob input, EV calc, save/load

## Vercel env vars to set (none are set yet)
- `KALSHI_API_KEY_ID` — Kalshi API key ID
- `KALSHI_PRIVATE_KEY` — RSA private key PEM (server-side only)
- `DATABASE_URL` — PostgreSQL connection string (optional)
- `ENABLE_TRADING=false` — keep this; do not change without explicit user instruction
- `OPENAI_API_KEY` — optional, enables GPT-4o-mini assistant

## Safety guardrails (never remove these)
- Do NOT add auto-trade or one-click bet execution
- Do NOT expose private key to client-side code
- Do NOT promise profit or guaranteed wins in UI copy
- Keep the risk disclaimer visible in the UI
- Default mode is read-only analysis

## Prisma models
User, Watchlist, WatchlistItem, MarketNote, AlertRule (AlertType: PRICE_ABOVE, PRICE_BELOW, SPREAD_TIGHTENS, SPREAD_WIDENS, VOLUME_SPIKE, EXPIRY_SOON), SavedCombo, OrderAuditLog, AssistantThread, AssistantMessage

## API routes
`src/app/api/kalshi/markets/`, `market/[ticker]/`, `orderbook/[ticker]/`, `account/`, `orders/`, `watchlist/`, `combos/`, `src/app/api/alerts/`, `src/app/api/assistant/`
