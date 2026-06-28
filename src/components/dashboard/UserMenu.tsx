"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function UserMenu({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const label = name || email || "Account";
  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-700/50 py-1.5 pl-1.5 pr-3 text-sm text-slate-200 hover:bg-ink-600"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-7 w-7 rounded-full" />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-gradient text-xs font-semibold text-white">
            {initial}
          </span>
        )}
        <span className="max-w-[10rem] truncate">{label}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-ink-600 bg-ink-800 shadow-xl">
            <div className="border-b border-ink-700 px-4 py-3 text-xs text-slate-400">
              {email}
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="block w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-ink-700"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
