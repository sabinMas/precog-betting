"use client";
import { Settings, Key, Database, Shield, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const envVars = [
    { key: "KALSHI_API_KEY_ID", label: "Kalshi API Key ID", required: false, desc: "Your Kalshi API key identifier for authenticated requests" },
    { key: "KALSHI_PRIVATE_KEY", label: "Kalshi RSA Private Key", required: false, desc: "RSA private key (PEM format) for request signing — keep server-side only" },
    { key: "DATABASE_URL", label: "Database URL", required: false, desc: "PostgreSQL connection string for watchlists, alerts, and combos" },
    { key: "ENABLE_TRADING", label: "Enable Trading", required: false, desc: 'Set to "true" to enable order submission (disabled by default)' },
    { key: "OPENAI_API_KEY", label: "OpenAI API Key", required: false, desc: "Enables the AI-powered research assistant (rule-based fallback if not set)" },
    { key: "DISCORD_WEBHOOK_URL", label: "Discord Webhook", required: false, desc: "Send alert notifications to a Discord channel" },
  ];

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <Settings className="h-6 w-6 text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-400">Configuration and environment variables</p>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Environment variables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-400">
              Configure these variables in your <code className="rounded bg-zinc-800 px-1 py-0.5 text-xs">.env.local</code> file (local dev) or Vercel project settings (production). Secrets are never exposed to the browser.
            </p>
            {envVars.map(({ key, label, desc }) => (
              <div key={key} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <code className="text-xs text-blue-300">{key}</code>
                  <Badge variant="secondary" className="text-[10px]">Optional</Badge>
                </div>
                <p className="text-xs text-zinc-300 font-medium">{label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* How auth works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Authentication & Signing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-400">
            <p>Kalshi authenticated requests use RSA-PSS SHA-256 signatures. Here's how it works:</p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Generate an RSA key pair: <code className="text-xs bg-zinc-800 rounded px-1">openssl genrsa -out private.pem 2048</code></li>
              <li>Extract public key: <code className="text-xs bg-zinc-800 rounded px-1">openssl rsa -in private.pem -pubout</code></li>
              <li>Register the public key on your Kalshi account dashboard</li>
              <li>Paste the private key (PEM) into <code className="text-xs bg-zinc-800 rounded px-1">KALSHI_PRIVATE_KEY</code></li>
              <li>Each request is signed server-side — your private key never reaches the browser</li>
            </ol>
            <div className="rounded-lg border border-blue-900 bg-blue-950/30 p-3 text-blue-300 text-xs">
              <strong>Security note:</strong> Never commit your private key to git. Use environment variables only. Vercel secrets are encrypted at rest.
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-400">
            <p>Watchlists, alerts, and saved combos require a PostgreSQL database. Recommended providers:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-zinc-300">Neon</strong> — free tier, serverless Postgres, pairs perfectly with Vercel</li>
              <li><strong className="text-zinc-300">Supabase</strong> — free tier, includes auth and realtime</li>
              <li><strong className="text-zinc-300">PlanetScale</strong> — MySQL-compatible (change Prisma provider to mysql)</li>
            </ul>
            <p className="text-xs text-zinc-500">Without a database, the API routes gracefully return empty data — the scanner, detail pages, and combo analysis all work without it.</p>
            <div className="rounded bg-zinc-800 p-2 font-mono text-xs text-zinc-300 space-y-1">
              <div>npm run db:generate  # generate Prisma client</div>
              <div>npm run db:push      # push schema to database</div>
            </div>
          </CardContent>
        </Card>

        {/* App info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              About This App
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400 space-y-2">
            <p>
              Kalshi Research Assistant is a read-only prediction market research tool. It pulls live data from the Kalshi public API and presents ranked market opportunities, orderbook analysis, and combo probability estimates.
            </p>
            <p>
              <strong className="text-zinc-300">This tool does not give financial advice.</strong> All analysis is for research purposes only. Users are solely responsible for any investment decisions.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Next.js 15", "TypeScript", "Tailwind CSS", "Prisma", "Kalshi API"].map((tech) => (
                <Badge key={tech} variant="outline">{tech}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
