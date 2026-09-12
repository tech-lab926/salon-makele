import { NextRequest, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, normalizeRole } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { sendEmail, emailVerificationEmail } from "@/lib/email";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site-url";
import crypto from "crypto";

import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const ipLimited = checkRateLimit(`register:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipLimited.ok) {
      return errorResponse("Too many registration attempts. Try again later.", 429);
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return errorResponse(firstIssue?.message || "Invalid registration data", 400);
    }
    const { name, email, password, role, areaId, categoryIds, medicalLicenseUrl, artmakeDiplomaUrl } = result.data;

    const isArtistReg = role === "artist";

    let artistSkillCategoryIdsOrdered: string[] | null = null;

    if (isArtistReg) {
      if (!areaId) {
        return errorResponse("エリア（都道府県）の選択は必須です", 400);
      }
      const area = await prisma.area.findUnique({ where: { id: BigInt(areaId) } });
      if (!area) {
        return errorResponse("Invalid area", 400);
      }

      if (!categoryIds || categoryIds.length === 0) {
        return errorResponse("施術カテゴリを1つ以上選択してください", 400);
      }

      const uniqueOrdered: string[] = [];
      const seen = new Set<string>();
      for (const x of categoryIds) {
        const s = String(x).trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        uniqueOrdered.push(s);
      }

      if (uniqueOrdered.length === 0) {
        return errorResponse("施術カテゴリを1つ以上選択してください", 400);
      }

      const skillCategoryBigInts = uniqueOrdered.map((id: any) => BigInt(id));
      const activeCats = await prisma.category.findMany({
        where: { id: { in: skillCategoryBigInts }, isActive: true },
        select: { id: true },
      });

      if (activeCats.length !== uniqueOrdered.length) {
        return errorResponse("無効なカテゴリが含まれています", 400);
      }
      artistSkillCategoryIdsOrdered = uniqueOrdered.slice(0, 20);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Email already registered", 409);
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    let stripeCustomerId = null;
    try {
      const { stripe } = await import("@/lib/stripe");
      const customer = await stripe.customers.create({ email, name });
      stripeCustomerId = customer.id;
    } catch (e) {
      console.error("Failed to create Stripe customer:", e);
    }

    const user = await prisma.$transaction(async (tx: any) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: isArtistReg ? "ARTIST" : "USER",
          stripeCustomerId,
          emailVerifications: {
            create: {
              token: verificationToken,
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (isArtistReg && artistSkillCategoryIdsOrdered) {
        const displayName =
          typeof body.displayName === "string" && body.displayName.trim()
            ? body.displayName.trim().slice(0, 100)
            : name.slice(0, 100);
        const bio =
          typeof body.bio === "string" && body.bio.trim()
            ? body.bio.trim().slice(0, 5000)
            : null;

        const artistRecord = await tx.artist.create({
          data: {
            userId: created.id,
            displayName,
            bio,
            areaId: BigInt(String(body.areaId)),
            isPublished: false,
            medicalLicenseUrl: medicalLicenseUrl || null,
            artmakeDiplomaUrl: artmakeDiplomaUrl || null,
            registrationStatus: "PROVISIONAL",
          },
        });

        await tx.artistSkill.createMany({
          data: artistSkillCategoryIdsOrdered.map((cid: any, i: number) => ({
            artistId: artistRecord.id,
            categoryId: BigInt(cid),
            sortOrder: i,
          })),
        });
      }

      return created;
    });

    if (user.role === "ARTIST") {
      const artistRow = await prisma.artist.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (artistRow) {
        const { grantEarlyRegistrationTrial } = await import("@/lib/subscription");
        await grantEarlyRegistrationTrial(artistRow.id).catch((e: any) =>
          console.error("Failed to grant early registration trial on register:", e),
        );
      }
    }

    const appUrl = getSiteUrl();
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;
    
    // Send verification email in the background using after to prevent freezing in serverless and preserve timing attack immunity
    after(async () => {
      try {
        const emailContent = emailVerificationEmail(name, verificationUrl);
        await sendEmail({ to: email, ...emailContent });
        
        if (isArtistReg) {
          const { artistProvisionalRegistrationEmail } = await import("@/lib/email");
          const provisionalContent = artistProvisionalRegistrationEmail(name, `${appUrl}/contact`);
          await sendEmail({ to: email, ...provisionalContent });
        }
      } catch (err) {
        console.error("Failed to send registration emails in background:", err);
      }
    });

    return successResponse(
      {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: normalizeRole(user.role),
      },
      201,
    );
  } catch (error) {
    console.error("Registration error:", error);
    return errorResponse("Internal server error", 500);
  }
}
