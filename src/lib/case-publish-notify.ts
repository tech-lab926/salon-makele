import { prisma } from "@/lib/prisma";
import { sendEmail, casePublishedEmail } from "@/lib/email";

/** When admin publishes a case for the first time: in-app notification + email to artist. */
export async function notifyArtistCaseFirstPublished(params: {
  caseId: bigint;
  caseTitle: string;
  artistUserId: bigint;
  artistEmail: string;
  artistDisplayName: string;
}): Promise<void> {
  const { caseId, caseTitle, artistUserId, artistEmail, artistDisplayName } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const caseUrl = `${appUrl}/cases/${caseId.toString()}`;

  try {
    await prisma.notification.create({
      data: {
        userId: artistUserId,
        type: "case_approved",
        title: "症例が公開されました",
        body: `「${caseTitle}」が掲載承認され、サイト上に公開されました。`,
        refId: caseId,
        refType: "case",
      },
    });
  } catch (err) {
    console.error("Case publish notification:", err);
  }

  const mail = casePublishedEmail(artistDisplayName, caseTitle, caseUrl);
  try {
    await sendEmail({ to: artistEmail, ...mail });
  } catch (err) {
    console.error("Failed to send case publish notification email:", err);
  }
}
