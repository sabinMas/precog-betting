import { NextRequest, NextResponse } from "next/server";
import { getMarkets } from "@/lib/kalshi/public";
import { normalizeMarkets } from "@/lib/kalshi/normalize";
import { MOCK_MARKETS } from "@/lib/kalshi/mock";

export const runtime = "nodejs";

function buildSystemContext(markets: ReturnType<typeof normalizeMarkets>): string {
  const top = markets
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, 20)
    .map(
      (m) =>
        `${m.ticker} | ${m.title} | yes:${m.yes_ask}¢ | prob:${(m.impliedProbability * 100).toFixed(1)}% | spread:${m.spread}¢ | vol24h:${m.volume_24h ?? m.volume} | score:${m.compositeScore.toFixed(0)} | tags:[${m.surfacedReasons.join(",")}]`
    )
    .join("\n");

  return `You are a Kalshi prediction market research assistant. You provide factual analysis about prediction markets, help users understand contracts, and explain analytical concepts. You DO NOT give financial advice or guarantee outcomes.

Current top markets snapshot (live data):
${top}

Always ground your answers in the market data above. Do not invent prices or statistics not present here. When asked about specific markets not in the snapshot, explain you can only see the top 20 by composite score right now.

IMPORTANT: All analysis is for research purposes only. Prediction markets carry risk. Past performance does not guarantee future results.`;
}

export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Get live market context
  let markets: ReturnType<typeof normalizeMarkets> = [];
  try {
    const resp = await getMarkets({ status: "open", limit: 50 });
    markets = normalizeMarkets(resp.markets ?? []);
  } catch {
    markets = normalizeMarkets(MOCK_MARKETS);
  }

  const systemContext = buildSystemContext(markets);

  // Use OpenAI if configured, otherwise return a rule-based response
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemContext },
            { role: "user", content: message },
          ],
          max_tokens: 600,
          temperature: 0.3,
        }),
      });
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content ?? "No response generated.";
      return NextResponse.json({ response: answer });
    } catch (err) {
      console.error("OpenAI error:", err);
    }
  }

  // Rule-based fallback assistant
  const lowerMsg = message.toLowerCase();
  let response = "";

  if (lowerMsg.includes("moved most") || lowerMsg.includes("fast mover")) {
    const fastMovers = markets
      .filter((m) => m.isFastMover)
      .slice(0, 5)
      .map((m) => `• **${m.ticker}** — ${m.title} (score: ${m.compositeScore.toFixed(0)})`)
      .join("\n");
    response = `**Fast movers right now:**\n${fastMovers || "No fast movers detected in current data."}`;
  } else if (lowerMsg.includes("tight spread") || lowerMsg.includes("liquid")) {
    const tight = markets
      .filter((m) => m.spread <= 5)
      .sort((a, b) => a.spread - b.spread)
      .slice(0, 5)
      .map((m) => `• **${m.ticker}** — spread: ${m.spread}¢, prob: ${(m.impliedProbability * 100).toFixed(1)}%`)
      .join("\n");
    response = `**Tightest spreads:**\n${tight || "No tight-spread markets found."}`;
  } else if (lowerMsg.includes("high volume")) {
    const highVol = markets
      .filter((m) => m.isHighVolume)
      .slice(0, 5)
      .map((m) => `• **${m.ticker}** — ${m.title} (24h vol: ${m.volume_24h ?? m.volume})`)
      .join("\n");
    response = `**Highest volume markets:**\n${highVol || "No high-volume markets found."}`;
  } else if (lowerMsg.includes("expir")) {
    const expiring = markets
      .filter((m) => m.isExpiringSoon)
      .sort((a, b) => a.expiresInMs - b.expiresInMs)
      .slice(0, 5)
      .map((m) => `• **${m.ticker}** — expires in ${m.expiresInLabel}`)
      .join("\n");
    response = `**Expiring soon:**\n${expiring || "No markets expiring in the next 24h."}`;
  } else if (lowerMsg.includes("top") || lowerMsg.includes("best") || lowerMsg.includes("interesting")) {
    const top = markets
      .slice(0, 5)
      .map(
        (m) =>
          `• **${m.ticker}** — ${m.title}\n  Prob: ${(m.impliedProbability * 100).toFixed(1)}% | Spread: ${m.spread}¢ | Tags: ${m.surfacedReasons.join(", ")}`
      )
      .join("\n");
    response = `**Top markets by composite score:**\n${top}`;
  } else {
    response = `I can help you analyze Kalshi prediction markets. Try asking:\n- "Which markets moved most today?"\n- "Show markets with tight spreads"\n- "What are the top markets by volume?"\n- "Which markets are expiring soon?"\n\nFor deeper analysis, configure an OpenAI API key in your environment settings.`;
  }

  return NextResponse.json({ response });
}
