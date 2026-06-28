import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEnabledModels, creditCostFor } from "@/lib/models";
import { isFalConfigured } from "@/lib/fal";
import { ImageStudio } from "@/components/studio/ImageStudio";

export const dynamic = "force-dynamic";

export default async function ImageStudioPage() {
  const session = await auth();
  const credits = session!.user.credits;

  const models = getEnabledModels("IMAGE").map((m) => ({
    id: m.id,
    label: m.label,
    description: m.description,
    costPerImage: creditCostFor(m, { numImages: 1 }),
  }));

  const presetRows = await prisma.preset.findMany({
    where: { type: "IMAGE" },
    orderBy: [{ featured: "desc" }, { title: "asc" }],
  });

  const presets = presetRows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    thumbnailUrl: p.thumbnailUrl,
    featured: p.featured,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Image studio</h1>
        <p className="mt-1 text-slate-400">
          Describe what you want, optionally start from a preset, and generate.
        </p>
      </div>

      {!isFalConfigured() && (
        <div className="mb-6 rounded-lg border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-200">
          Generation isn&apos;t configured yet — the server is missing{" "}
          <code>FAL_KEY</code>. You can explore the UI, but generating will be
          disabled until the key is set.
        </div>
      )}

      <ImageStudio
        models={models}
        presets={presets}
        credits={credits}
        falConfigured={isFalConfigured()}
      />
    </div>
  );
}
