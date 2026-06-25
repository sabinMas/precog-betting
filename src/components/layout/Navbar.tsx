"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  BarChart2,
  FlaskConical,
  Star,
  Bell,
  Wallet,
  Settings,
  TrendingUp,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Scanner", icon: TrendingUp },
  { href: "/combo-lab", label: "Combo Lab", icon: FlaskConical },
  { href: "/watchlists", label: "Watchlists", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/account", label: "Account", icon: Wallet },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-100">
          <BarChart2 className="h-5 w-5 text-blue-400" />
          <span>{process.env.NEXT_PUBLIC_APP_NAME ?? "Kalshi Research"}</span>
          <span className="ml-1 rounded bg-blue-900 px-1.5 py-0.5 text-xs text-blue-300">
            Research
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                pathname === href
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
