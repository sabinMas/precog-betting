import { AlertTriangle } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-xs text-zinc-500">
      <AlertTriangle className="mr-1 inline h-3 w-3 text-yellow-600" />
      This tool provides <strong className="text-zinc-400">research assistance only</strong> — not financial advice.
      Prediction markets carry risk. Past signals do not guarantee future outcomes.
      Users are solely responsible for any trade decisions.
    </div>
  );
}
