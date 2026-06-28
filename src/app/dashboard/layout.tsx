import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { UserMenu } from "@/components/dashboard/UserMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-ink-700 px-6 py-3">
          <div />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-700/50 px-3 py-1.5 text-sm">
              <span className="text-brand-400">◇</span>
              <span className="font-medium text-white">
                {session.user.credits}
              </span>
              <span className="text-slate-400">credits</span>
            </div>
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
