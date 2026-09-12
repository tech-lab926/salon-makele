import { prisma } from "./prisma";

export const EARLY_BIRD_TRIAL_DAYS = 90;
const PREMIUM_PLAN_CODE = "premium";

export async function getArtistActivePlan(artistId: bigint | string) {
  const activeSub = await prisma.artistSubscription.findFirst({
    where: {
      artistId: BigInt(artistId),
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  if (activeSub) return activeSub;

  // Fallback to free plan
  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { planCode: "free" },
  });

  if (!freePlan) {
    return {
      artistId: BigInt(artistId),
      planId: BigInt(0),
      isTrial: false,
      startedAt: new Date(),
      expiresAt: null,
      plan: {
        id: BigInt(0),
        planCode: "free",
        name: "Free",
        monthlyFee: 0,
        feeRate: 0,
        maxCases: 0,
        isActive: true,
        createdAt: new Date(),
      },
    };
  }

  return {
    artistId: BigInt(artistId),
    planId: freePlan.id,
    isTrial: false,
    startedAt: new Date(),
    expiresAt: null,
    plan: freePlan,
  };
}

export async function grantEarlyRegistrationTrial(artistId: bigint | string) {
  const id = BigInt(artistId);

  const activeSub = await prisma.artistSubscription.findFirst({
    where: {
      artistId: id,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });
  if (activeSub) return activeSub;

  const hadEarlyBirdTrial = await prisma.artistSubscription.findFirst({
    where: { artistId: id, isTrial: true },
    select: { id: true },
  });
  if (hadEarlyBirdTrial) return null;

  const premiumPlan = await prisma.subscriptionPlan.findUnique({
    where: { planCode: PREMIUM_PLAN_CODE },
  });

  if (!premiumPlan) throw new Error("Premium plan not found in database");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + EARLY_BIRD_TRIAL_DAYS);

  return prisma.artistSubscription.create({
    data: {
      artistId: id,
      planId: premiumPlan.id,
      isTrial: true,
      expiresAt,
    },
    include: { plan: true },
  });
}
