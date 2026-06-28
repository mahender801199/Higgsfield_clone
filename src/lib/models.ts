import type { GenerationType } from "@prisma/client";

/**
 * Model registry.
 *
 * Each model exposes a `baseCredits` figure that reflects the underlying
 * vendor cost (normalized into credits) and a `marginMultiplier` so we can
 * tune the price we charge users per model. The final credit cost is
 * `ceil(baseCredits * marginMultiplier)` with a floor of 1.
 *
 * 1 credit ≈ $0.01 of value. FLUX.1 [dev] runs ~$0.025 / megapixel; a
 * 1MP image ≈ 2.5 credits of raw cost, so baseCredits=3 at 1.6x margin ≈ 5
 * credits charged. Adjust freely — this is the single source of truth.
 */

export type ModelProvider = "fal" | "replicate";

export type ImageSizePreset =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9";

export interface ModelDef {
  /** Provider-side model slug, e.g. "fal-ai/flux/dev". */
  id: string;
  label: string;
  provider: ModelProvider;
  type: GenerationType;
  description: string;
  /** Raw cost in credits before margin. */
  baseCredits: number;
  /** Per-model margin multiplier applied on top of baseCredits. */
  marginMultiplier: number;
  /** Whether the model is selectable in the UI (Phase 2 ships one). */
  enabled: boolean;
  /** Default generation params merged with user input. */
  defaults?: Record<string, unknown>;
}

export const IMAGE_MODELS: ModelDef[] = [
  {
    id: "fal-ai/flux/dev",
    label: "FLUX.1 [dev]",
    provider: "fal",
    type: "IMAGE",
    description:
      "12B flow-transformer. Excellent prompt adherence and detail. Great general-purpose default.",
    baseCredits: 3,
    marginMultiplier: 1.6,
    enabled: true,
    defaults: {
      image_size: "landscape_4_3",
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      output_format: "jpeg",
      enable_safety_checker: true,
    },
  },
  // Additional image models are enabled in Phase 4.
  {
    id: "fal-ai/flux/schnell",
    label: "FLUX.1 [schnell]",
    provider: "fal",
    type: "IMAGE",
    description: "Distilled FLUX — much faster, lower cost, slightly less detail.",
    baseCredits: 1,
    marginMultiplier: 2,
    enabled: false,
  },
];

export const ALL_MODELS: ModelDef[] = [...IMAGE_MODELS];

export function getModel(id: string): ModelDef | undefined {
  return ALL_MODELS.find((m) => m.id === id);
}

export function getEnabledModels(type: GenerationType): ModelDef[] {
  return ALL_MODELS.filter((m) => m.type === type && m.enabled);
}

/** Final credit cost charged for one generation request with this model. */
export function creditCostFor(model: ModelDef, opts?: { numImages?: number }): number {
  const numImages = Math.max(1, opts?.numImages ?? 1);
  const perImage = Math.max(1, Math.ceil(model.baseCredits * model.marginMultiplier));
  return perImage * numImages;
}
