import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { auth } from "@/lib/auth";

const features = [
  {
    title: "Image studio",
    body: "Text-to-image across multiple models, one-click style presets, reference elements, upscaling and background removal.",
  },
  {
    title: "Video studio",
    body: "Text- and image-to-video with camera motion presets, reframing, and resolution upscaling.",
  },
  {
    title: "Consistent characters",
    body: "Upload a handful of photos to lock in a subject, then reuse them across every generation.",
  },
  {
    title: "Voice & dubbing",
    body: "Text-to-speech, instant voice cloning, and full video dubbing into new languages.",
  },
  {
    title: "Marketing studio",
    body: "Drop in a product URL or photo and generate a structured ad: hook, product shot, call to action.",
  },
  {
    title: "Credits & billing",
    body: "Transparent per-generation pricing with subscriptions and one-time credit packs.",
  },
];

export default async function HomePage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ambient gradient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full bg-accent-600/20 blur-[120px]" />
      </div>

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link href="/login" className="btn-ghost">
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center">
        <span className="inline-block rounded-full border border-ink-600 bg-ink-800/60 px-4 py-1.5 text-xs font-medium text-brand-300">
          Multi-model AI media studio
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Create at the speed of{" "}
          <span className="bg-brand-gradient bg-clip-text text-transparent">
            imagination
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Lumora brings the best image, video, and voice models together in one
          studio. Generate, edit, and scale content for your brand — no model
          wrangling required.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/login" className="btn-primary px-6 py-3 text-base">
            Get started free
          </Link>
          <a href="#features" className="btn-ghost px-6 py-3 text-base">
            Explore features
          </a>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          50 free credits when you sign up. No card required.
        </p>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink-700">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <span>© {new Date().getFullYear()} Lumora Studio. All rights reserved.</span>
        </div>
      </footer>
    </main>
  );
}
