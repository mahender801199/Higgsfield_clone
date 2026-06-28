import { prisma } from "@/lib/prisma";

/**
 * Credit accounting helpers.
 *
 * All spend/grant operations run inside a transaction and write a CreditTxn
 * ledger entry so balances are always auditable. Generation cost calculation
 * (per-model base cost * margin multiplier) lives in src/lib/models.ts and is
 * wired up in Phase 2.
 */

export class InsufficientCreditsError extends Error {
  constructor(public readonly required: number, public readonly available: number) {
    super(`Insufficient credits: need ${required}, have ${available}`);
    this.name = "InsufficientCreditsError";
  }
}

export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}

/** Grant credits (signup bonus, Stripe top-up, subscription renewal). */
export async function grantCredits(userId: string, amount: number, reason: string) {
  if (amount <= 0) throw new Error("grantCredits amount must be positive");
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
      select: { credits: true },
    });
    await tx.creditTxn.create({
      data: { userId, amount, reason, balance: user.credits },
    });
    return user.credits;
  });
}

/**
 * Atomically spend credits. Throws InsufficientCreditsError if the balance is
 * too low. Returns the new balance.
 */
export async function spendCredits(userId: string, amount: number, reason: string) {
  if (amount <= 0) throw new Error("spendCredits amount must be positive");
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });
    const balance = user?.credits ?? 0;
    if (balance < amount) throw new InsufficientCreditsError(amount, balance);

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
      select: { credits: true },
    });
    await tx.creditTxn.create({
      data: { userId, amount: -amount, reason, balance: updated.credits },
    });
    return updated.credits;
  });
}

/** Refund credits when a generation job fails after being charged. */
export async function refundCredits(userId: string, amount: number, reason: string) {
  return grantCredits(userId, amount, `refund:${reason}`);
}
