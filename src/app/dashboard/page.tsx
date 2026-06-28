import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { navItems } from "@/lib/nav";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [generationCount, recent] = await Promise.all([
    prisma.generation.count({ where: { userId } }),
    prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const modules = navItems.filter(
    (i) => i.href !== "/dashboard" && i.href !== "/dashboard/billing",
  );

  const firstName = session!.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Welcome, {firstName} 👋
        </h1>
        <p className="mt-1 text-slate-400">
          Your studio is ready. Pick a module to start creating.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Credit balance" value={`${session!.user.credits}`} hint="◇ available" />
        <StatCard label="Generations" value={`${generationCount}`} hint="all time" />
        <StatCard label="Plan" value="Free" hint="upgrade in Billing" />
      </div>

      {/* Module grid */}
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
          Studio modules
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="card group p-5 transition-colors hover:border-brand-600"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl text-brand-400">{m.icon}</span>
                {m.comingSoon && (
                  <span className="rounded bg-ink-600 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                    Soon
                  </span>
                )}
              </div>
              <h3 className="mt-3 font-medium text-white group-hover:text-brand-200">
                {m.label}
              </h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
          Recent activity
        </h2>
        {recent.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-500">
            No generations yet. Your history will appear here once you start
            creating.
          </div>
        ) : (
          <div className="card divide-y divide-ink-700">
            {recent.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-slate-300">{g.type}</span>
                <span className="text-slate-500">{g.model}</span>
                <span className="text-slate-500">{g.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}
