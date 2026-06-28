import { fal } from "@fal-ai/client";

/**
 * Thin wrapper around the fal.ai queue API.
 *
 * We use the asynchronous queue (submit → poll status → fetch result) rather
 * than the blocking `subscribe`, so HTTP requests never hold a long-lived
 * connection. A BullMQ worker replaces the client-side polling in a later
 * phase, but this keeps Phase 2 fully functional without Redis.
 */

let configured = false;

export function isFalConfigured(): boolean {
  return Boolean(process.env.FAL_KEY);
}

function ensureConfigured() {
  if (!isFalConfigured()) {
    throw new FalNotConfiguredError();
  }
  if (!configured) {
    fal.config({ credentials: process.env.FAL_KEY });
    configured = true;
  }
}

export class FalNotConfiguredError extends Error {
  constructor() {
    super("FAL_KEY is not set. Image/video generation is not configured.");
    this.name = "FalNotConfiguredError";
  }
}

export type FalQueueStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";

export interface FalImage {
  url: string;
  content_type?: string;
  width?: number;
  height?: number;
}

export interface FalImageResult {
  images: FalImage[];
  seed?: number;
  prompt?: string;
  has_nsfw_concepts?: boolean[];
}

/** Submit a job to the fal queue. Returns the request id used for polling. */
export async function submitJob(
  modelId: string,
  input: Record<string, unknown>,
  opts?: { webhookUrl?: string },
): Promise<string> {
  ensureConfigured();
  const { request_id } = await fal.queue.submit(modelId, {
    input,
    webhookUrl: opts?.webhookUrl,
  });
  return request_id;
}

/** Check the status of a queued job. */
export async function getJobStatus(
  modelId: string,
  requestId: string,
): Promise<{ status: FalQueueStatus; queuePosition?: number }> {
  ensureConfigured();
  const res = await fal.queue.status(modelId, { requestId, logs: false });
  return {
    status: res.status as FalQueueStatus,
    queuePosition: (res as { queue_position?: number }).queue_position,
  };
}

/** Fetch the result of a completed job. */
export async function getImageResult(
  modelId: string,
  requestId: string,
): Promise<FalImageResult> {
  ensureConfigured();
  const res = await fal.queue.result(modelId, { requestId });
  return res.data as FalImageResult;
}
