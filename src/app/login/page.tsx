import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { auth, authOptions } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { verify?: string; error?: string };
}) {
  const session = await auth();
  if (session) redirect("/dashboard");

  // Detect which providers are configured so the UI only shows usable options.
  const providerIds = new Set(authOptions.providers.map((p) => p.id));
  const hasGoogle = providerIds.has("google");
  const hasEmail = providerIds.has("email");
  const noProviders = !hasGoogle && !hasEmail;

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/4 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-brand-600/15 blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in or create an account to start generating.
          </p>

          {searchParams.verify && (
            <div className="mt-5 rounded-lg border border-brand-700 bg-brand-950/40 p-3 text-sm text-brand-200">
              Check your inbox for a magic sign-in link.
            </div>
          )}
          {searchParams.error && (
            <div className="mt-5 rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
              Something went wrong signing you in. Please try again.
            </div>
          )}

          {noProviders ? (
            <div className="mt-6 rounded-lg border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
              No auth providers are configured yet. Set Google OAuth or SMTP
              email credentials in your <code>.env</code> file. See{" "}
              <code>.env.example</code> for the required variables.
            </div>
          ) : (
            <LoginForm hasGoogle={hasGoogle} hasEmail={hasEmail} />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          By continuing you agree to Lumora&apos;s Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
