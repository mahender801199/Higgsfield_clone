import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { getModel, creditCostFor } from "@/lib/models";
import { renderPromptTemplate } from "@/lib/prompt";
import {
  spendCredits,
  refundCredits,
  InsufficientCreditsError,
} from "@/lib/credits";
import { submitJob, isFalConfigured } from "@/lib/fal";

export const dynamic = "force-dynamic";

const IMAGE_SIZES = [
  "square_hd",
  "square",
  "portrait_4_3",
  "portrait_16_9",
  "landscape_4_3",
  "landscape_16_9",
] as const;

const bodySchema = z
  .object({
    modelId: z.string().min(1),
    prompt: z.string().trim().max(2000).optional(),
    presetId: z.string().optional(),
    subject: z.string().trim().max(800).optional(),
    imageSize: z.enum(IMAGE_SIZES).optional(),
    numImages: z.number().int().min(1).max(4).optional(),
    guidanceScale: z.number().min(1).max(20).optional(),
    numInferenceSteps: z.number().int().min(1).max(50).optional(),
    seed: z.number().int().optional(),
  })
  .refine((d) => Boolean(d.prompt?.length) || Boolean(d.presetId), {
    message: "Provide a prompt or select a preset.",
  });

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  if (!isFalConfigured()) {
    return NextResponse.json(
      { error: "Image generation is not configured. FAL_KEY is missing on the server." },
      { status: 503 },
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const model = getModel(body.modelId);
  if (!model || model.type !== "IMAGE" || !model.enabled) {
    return NextResponse.json({ error: "Unknown or unavailable model" }, { status: 400 });
  }

  // Resolve preset (if any) and build the final prompt + default params.
  let preset = null as Awaited<ReturnType<typeof prisma.preset.findUnique>> | null;
  if (body.presetId) {
    preset = await prisma.preset.findUnique({ where: { id: body.presetId } });
    if (!preset) {
      return NextResponse.json({ error: "Preset not found" }, { status: 400 });
    }
  }

  const presetModifiers = (preset?.modifiers as Record<string, unknown> | null) ?? {};

  const finalPrompt = preset
    ? renderPromptTemplate(preset.promptTemplate, body.subject ?? body.prompt ?? "")
    : (body.prompt as string);

  if (!finalPrompt.trim()) {
    return NextResponse.json(
      { error: "The resulting prompt is empty. Add a subject or prompt." },
      { status: 400 },
    );
  }

  const numImages = body.numImages ?? (model.defaults?.num_images as number) ?? 1;

  // Resolve params with precedence: explicit user input > preset modifier > model default.
  const imageSize =
    body.imageSize ??
    (presetModifiers.aspectRatioToSize as string | undefined) ??
    (presetModifiers.image_size as string | undefined) ??
    (model.defaults?.image_size as string) ??
    "landscape_4_3";

  const guidanceScale =
    body.guidanceScale ??
    (presetModifiers.guidance as number | undefined) ??
    (model.defaults?.guidance_scale as number) ??
    3.5;

  const numInferenceSteps =
    body.numInferenceSteps ?? (model.defaults?.num_inference_steps as number) ?? 28;

  const falInput: Record<string, unknown> = {
    prompt: finalPrompt,
    image_size: imageSize,
    guidance_scale: guidanceScale,
    num_inference_steps: numInferenceSteps,
    num_images: numImages,
    output_format: (model.defaults?.output_format as string) ?? "jpeg",
    enable_safety_checker: model.defaults?.enable_safety_checker ?? true,
  };
  if (typeof body.seed === "number") falInput.seed = body.seed;

  const creditCost = creditCostFor(model, { numImages });

  // 1) Charge credits up front (atomic, throws if insufficient).
  try {
    await spendCredits(userId, creditCost, `generation:image:${model.id}`);
  } catch (e) {
    if (e instanceof InsufficientCreditsError) {
      return NextResponse.json(
        {
          error: "Not enough credits.",
          required: e.required,
          available: e.available,
        },
        { status: 402 },
      );
    }
    throw e;
  }

  // 2) Persist the generation record.
  const generation = await prisma.generation.create({
    data: {
      userId,
      type: "IMAGE",
      model: model.id,
      status: "PROCESSING",
      creditCost,
      inputParams: {
        prompt: finalPrompt,
        presetId: body.presetId ?? null,
        subject: body.subject ?? null,
        ...falInput,
      },
    },
  });

  // 3) Submit to fal. On failure, refund and mark the record failed.
  try {
    const requestId = await submitJob(model.id, falInput);
    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: { jobId: requestId },
    });
    return NextResponse.json({ generation: updated }, { status: 201 });
  } catch (err) {
    await refundCredits(userId, creditCost, `generation:image:${model.id}`);
    await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : "Failed to submit job",
      },
    });
    return NextResponse.json(
      { error: "Failed to start generation. Your credits were refunded." },
      { status: 502 },
    );
  }
}
