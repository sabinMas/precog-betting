# Kalshi Research Assistant

A production-ready prediction market research dashboard powered by the [Kalshi](https://kalshi.com) API. Analyze live markets, build parlay combinations, set alerts, and explore opportunities — all in read-only research mode.

> **Disclaimer:** This tool provides research assistance only — not financial advice. Prediction markets carry risk. Users are solely responsible for any trade decisions.

## Features

- **Market Scanner** — ranked feed of open contracts with composite scoring (spread, volume, momentum, liquidity)
- **Contract Detail** — live pricing, orderbook depth chart, EV calculator, research notes
- **Combo Lab** — build multi-leg research combinations with combined probability estimates and correlation risk warnings
- **Watchlists** — star markets and track them across sessions
- **Alerts** — price threshold, spread, volume, and expiry alerts
- **Account View** — balance, positions, orders, and fills (requires API credentials)
- **AI Research Assistant** — grounded in live market data, answers questions in natural language

## Quick Start

```bash
npm install
cp .env.example .env.local
# edit .env.local
npm run db:generate && npm run db:push  # optional
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KALSHI_API_KEY_ID` | No | Kalshi API key ID for authenticated endpoints |
| `KALSHI_PRIVATE_KEY` | No | RSA private key PEM for request signing |
| `DATABASE_URL` | No | PostgreSQL connection string |
| `ENABLE_TRADING` | No | Set `true` to enable order submission (default: `false`) |
| `OPENAI_API_KEY` | No | GPT-4o-mini for AI assistant |

## Kalshi API Key Setup

```bash
openssl genrsa -out kalshi_private.pem 2048
openssl rsa -in kalshi_private.pem -pubout -out kalshi_public.pem
```

Register `kalshi_public.pem` at Kalshi account settings → copy the Key ID → set `KALSHI_API_KEY_ID`. Paste `kalshi_private.pem` contents into `KALSHI_PRIVATE_KEY`.

## Deploy to Vercel

Connect this GitHub repo in the Vercel dashboard and set environment variables in Project → Settings → Environment Variables. Add `KALSHI_PRIVATE_KEY` as a multiline secret (full PEM).

## Combo Lab Warning

Combined probability estimates assume statistical independence — which is rarely true. Treat all combo estimates as rough approximations for hypothesis exploration only.
