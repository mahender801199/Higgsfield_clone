"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { navItems } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-ink-700 bg-ink-800/40">
      <div className="px-5 py-5">
        <Link href="/dashboard">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-ink-700 text-white"
                  : "text-slate-400 hover:bg-ink-700/50 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="w-4 text-center text-brand-400">{item.icon}</span>
                {item.label}
              </span>
              {item.comingSoon && (
                <span className="rounded bg-ink-600 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ink-700 px-5 py-4 text-xs text-slate-500">
        Lumora Studio · v0.1
      </div>
    </aside>
  );
}
