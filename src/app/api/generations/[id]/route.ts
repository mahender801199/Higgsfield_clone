import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { getJobStatus, getImageResult } from "@/lib/fal";
import { refundCredits } from "@/lib/credits";

export const dynamic = "force-dynamic";

/**
 * Returns a generation's current state. If it's still PROCESSING and backed by
 * a fal queue job, this polls fal: when the job completes we fetch the result,
 * persist the output URL, and flip the status to COMPLETED. On failure we
 * refund the user and mark it FAILED.
 *
 * (A background BullMQ worker takes over this reconciliation in a later phase;
 * for now polling on read keeps the flow fully working without Redis.)
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }

  const generation = await prisma.generation.findFirst({
    where: { id: params.id, userId },
  });
  if (!generation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Terminal states or jobs without a queue id need no reconciliation.
  if (
    generation.status === "COMPLETED" ||
    generation.status === "FAILED" ||
    !generation.jobId
  ) {
    return NextResponse.json({ generation });
  }

  try {
    const { status } = await getJobStatus(generation.model, generation.jobId);

    if (status !== "COMPLETED") {
      // Still queued / in progress — surface a normalized status.
      const liveStatus = status === "IN_PROGRESS" ? "PROCESSING" : "QUEUED";
      if (liveStatus !== generation.status) {
        const updated = await prisma.generation.update({
          where: { id: generation.id },
          data: { status: liveStatus },
        });
        return NextResponse.json({ generation: updated });
      }
      return NextResponse.json({ generation });
    }

    // Completed — fetch the result and persist outputs.
    const result = await getImageResult(generation.model, generation.jobId);
    const firstUrl = result.images?.[0]?.url ?? null;

    if (!firstUrl) {
      throw new Error("Generation completed but returned no image.");
    }

    const existingParams =
      (generation.inputParams as Record<string, unknown>) ?? {};

    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "COMPLETED",
        outputUrl: firstUrl,
        thumbnailUrl: firstUrl,
        inputParams: {
          ...existingParams,
          resultSeed: result.seed ?? null,
          allImageUrls: result.images.map((i) => i.url),
        },
      },
    });
    return NextResponse.json({ generation: updated });
  } catch (err) {
    // Refund and mark failed.
    await refundCredits(userId, generation.creditCost, `generation:${generation.type}:${generation.model}`);
    const updated = await prisma.generation.update({
      where: { id: generation.id },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : "Generation failed",
      },
    });
    return NextResponse.json({ generation: updated });
  }
}
