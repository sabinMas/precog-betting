"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Which markets moved most today?",
  "Show markets with tight spreads",
  "Which markets are expiring soon?",
  "Top markets by volume?",
];

export function AssistantSidebar() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Kalshi research assistant. I can help analyze markets, explain signals, and surface opportunities. Ask me anything about the current market data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to assistant. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-500 transition-colors"
        title="Open research assistant"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      {/* Sidebar panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-96 border-l border-zinc-800 bg-zinc-950 shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-400" />
            <span className="font-semibold text-zinc-100">Research Assistant</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-zinc-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex flex-col h-[calc(100%-112px)] overflow-y-auto p-4 gap-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <Bot className="mt-1 h-5 w-5 shrink-0 text-blue-400" />
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-200"
                )}
              >
                <span className="whitespace-pre-wrap">{msg.content}</span>
              </div>
              {msg.role === "user" && (
                <User className="mt-1 h-5 w-5 shrink-0 text-zinc-400" />
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <Bot className="mt-1 h-5 w-5 shrink-0 text-blue-400" />
              <div className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-400">
                <span className="animate-pulse">Analyzing markets…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts + input */}
        <div className="border-t border-zinc-800 p-3 space-y-2">
          <div className="flex flex-wrap gap-1">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(input); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about markets..."
              className="flex-1 text-xs"
            />
            <Button size="icon" type="submit" disabled={loading} className="h-9 w-9">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
