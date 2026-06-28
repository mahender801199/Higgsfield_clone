"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ModelOption = {
  id: string;
  label: string;
  description: string;
  costPerImage: number;
};

type PresetOption = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnailUrl: string | null;
  featured: boolean;
};

type Generation = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  outputUrl: string | null;
  error: string | null;
  creditCost: number;
  inputParams: Record<string, unknown>;
};

const IMAGE_SIZES: { value: string; label: string }[] = [
  { value: "square_hd", label: "Square (1:1)" },
  { value: "portrait_4_3", label: "Portrait (3:4)" },
  { value: "portrait_16_9", label: "Portrait (9:16)" },
  { value: "landscape_4_3", label: "Landscape (4:3)" },
  { value: "landscape_16_9", label: "Landscape (16:9)" },
];

export function ImageStudio({
  models,
  presets,
  credits,
  falConfigured,
}: {
  models: ModelOption[];
  presets: PresetOption[];
  credits: number;
  falConfigured: boolean;
}) {
  const router = useRouter();

  const [modelId, setModelId] = useState(models[0]?.id ?? "");
  const [presetId, setPresetId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState("landscape_4_3");
  const [numImages, setNumImages] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [guidanceScale, setGuidanceScale] = useState(3.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState(28);
  const [seed, setSeed] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<Generation | null>(null);

  const model = models.find((m) => m.id === modelId) ?? models[0];
  const selectedPreset = presets.find((p) => p.id === presetId) ?? null;
  const cost = (model?.costPerImage ?? 0) * numImages;
  const promptRequired = !presetId;
  const hasPromptInput = prompt.trim().length > 0;
  const insufficient = credits < cost;

  const canGenerate =
    falConfigured &&
    !busy &&
    !insufficient &&
    (presetId !== null || hasPromptInput) &&
    Boolean(model);

  // ── Polling ────────────────────────────────────────────────
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const isPending =
    generation?.status === "QUEUED" || generation?.status === "PROCESSING";

  useEffect(() => {
    if (!generation || !isPending) return;
    const id = generation.id;

    async function poll() {
      try {
        const res = await fetch(`/api/generations/${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        setGeneration(data.generation);
        if (
          data.generation.status === "COMPLETED" ||
          data.generation.status === "FAILED"
        ) {
          stopPolling();
          setBusy(false);
          // refresh server components so the credit balance updates
          router.refresh();
        }
      } catch {
        /* transient — keep polling */
      }
    }

    pollRef.current = setInterval(poll, 2500);
    void poll();
    return stopPolling;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation?.id, isPending]);

  useEffect(() => stopPolling, [stopPolling]);

  // ── Submit ─────────────────────────────────────────────────
  async function handleGenerate() {
    if (!canGenerate) return;
    setError(null);
    setBusy(true);
    setGeneration(null);

    const payload: Record<string, unknown> = {
      modelId,
      imageSize,
      numImages,
      guidanceScale,
      numInferenceSteps,
    };
    if (presetId) {
      payload.presetId = presetId;
      if (hasPromptInput) payload.subject = prompt.trim();
    } else {
      payload.prompt = prompt.trim();
    }
    if (seed.trim() !== "" && !Number.isNaN(Number(seed))) {
      payload.seed = Number(seed);
    }

    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Generation failed to start.");
        setBusy(false);
        return;
      }
      setGeneration(data.generation);
      router.refresh(); // credits were just charged
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  const resultUrls =
    (generation?.inputParams?.allImageUrls as string[] | undefined) ??
    (generation?.outputUrl ? [generation.outputUrl] : []);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* ── Controls ───────────────────────────────────────── */}
      <div className="space-y-5">
        {/* Model */}
        <div className="card p-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
            Model
          </label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} — {m.costPerImage} cr/image
              </option>
            ))}
          </select>
          {model && (
            <p className="mt-2 text-xs text-slate-500">{model.description}</p>
          )}
        </div>

        {/* Prompt */}
        <div className="card p-4">
          <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
            {selectedPreset ? "Subject (fills the preset)" : "Prompt"}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder={
              selectedPreset
                ? "e.g. a golden retriever puppy"
                : "Describe the image you want to create…"
            }
            className="w-full resize-none rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500"
          />
          {promptRequired && !hasPromptInput && (
            <p className="mt-1 text-xs text-slate-600">
              Required when no preset is selected.
            </p>
          )}
        </div>

        {/* Output options */}
        <div className="card space-y-4 p-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Aspect ratio
            </label>
            <select
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value)}
              className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
            >
              {IMAGE_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Images: {numImages}
            </label>
            <input
              type="range"
              min={1}
              max={4}
              value={numImages}
              onChange={(e) => setNumImages(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-brand-300 hover:text-brand-200"
          >
            {showAdvanced ? "− Hide advanced" : "+ Advanced settings"}
          </button>

          {showAdvanced && (
            <div className="space-y-4 border-t border-ink-700 pt-4">
              <div>
                <label className="mb-2 block text-xs text-slate-500">
                  Guidance scale: {guidanceScale}
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={0.5}
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs text-slate-500">
                  Inference steps: {numInferenceSteps}
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={numInferenceSteps}
                  onChange={(e) => setNumInferenceSteps(Number(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">
                  Seed (optional)
                </label>
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="random"
                  className="w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Generate */}
        <div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="btn-primary w-full py-3 text-base"
          >
            {busy ? "Generating…" : `Generate · ${cost} credits`}
          </button>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          {insufficient && (
            <p className="mt-2 text-sm text-amber-400">
              Not enough credits ({credits} available, {cost} needed).
            </p>
          )}
          <p className="mt-2 text-center text-xs text-slate-600">
            {credits} credits available
          </p>
        </div>
      </div>

      {/* ── Right column: presets + result ─────────────────── */}
      <div className="space-y-6">
        {/* Result canvas */}
        <ResultCanvas
          generation={generation}
          pending={isPending}
          urls={resultUrls}
          aspect={imageSize}
        />

        {/* Preset library */}
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
            Preset library
          </h2>
          {presets.length === 0 ? (
            <p className="card p-6 text-sm text-slate-500">
              No presets yet. Run <code>npm run db:seed</code> to load the
              starter library.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <PresetCard
                active={presetId === null}
                onClick={() => setPresetId(null)}
                title="No preset"
                description="Use your raw prompt as-is."
                category="custom"
              />
              {presets.map((p) => (
                <PresetCard
                  key={p.id}
                  active={presetId === p.id}
                  onClick={() => setPresetId(p.id)}
                  title={p.title}
                  description={p.description}
                  category={p.category}
                  featured={p.featured}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultCanvas({
  generation,
  pending,
  urls,
  aspect,
}: {
  generation: Generation | null;
  pending: boolean;
  urls: string[];
  aspect: string;
}) {
  const aspectClass =
    aspect === "square_hd"
      ? "aspect-square"
      : aspect === "portrait_4_3"
        ? "aspect-[3/4]"
        : aspect === "portrait_16_9"
          ? "aspect-[9/16]"
          : aspect === "landscape_16_9"
            ? "aspect-video"
            : "aspect-[4/3]";

  if (!generation && !pending) {
    return (
      <div className={`card flex ${aspectClass} max-h-[60vh] items-center justify-center text-center`}>
        <div className="px-6">
          <div className="text-4xl text-ink-500">✦</div>
          <p className="mt-3 text-sm text-slate-500">
            Your generated images will appear here.
          </p>
        </div>
      </div>
    );
  }

  if (pending) {
    return (
      <div className={`card flex ${aspectClass} max-h-[60vh] items-center justify-center`}>
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-ink-500 border-t-brand-400" />
          <p className="mt-4 text-sm text-slate-400">
            {generation?.status === "QUEUED" ? "Queued…" : "Generating…"}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            This usually takes a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (generation?.status === "FAILED") {
    return (
      <div className="card border-red-900/60 p-6">
        <p className="text-sm font-medium text-red-400">Generation failed</p>
        <p className="mt-1 text-sm text-slate-400">
          {generation.error ?? "Something went wrong."}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Your {generation.creditCost} credits were refunded.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {urls.map((url) => (
        // eslint-disable-next-line @next/next/no-img-element
        <a key={url} href={url} target="_blank" rel="noreferrer" className="block">
          <img
            src={url}
            alt="Generated result"
            className="w-full rounded-xl border border-ink-600"
          />
        </a>
      ))}
    </div>
  );
}

function PresetCard({
  active,
  onClick,
  title,
  description,
  category,
  featured,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string | null;
  category: string;
  featured?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`card p-4 text-left transition-colors ${
        active ? "border-brand-500 ring-1 ring-brand-500/40" : "hover:border-ink-500"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-brand-300">
          {category}
        </span>
        {featured && <span className="text-xs text-accent-400">★</span>}
      </div>
      <h3 className="mt-1 font-medium text-white">{title}</h3>
      {description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{description}</p>
      )}
    </button>
  );
}
