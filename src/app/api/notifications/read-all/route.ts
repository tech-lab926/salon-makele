import { getAuthUser } from "@/lib/auth";
import { prisma, isMockPrisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Unauthorized", 401);

    if (isMockPrisma) {
      const notifications = (prisma as unknown as { _dbData: { notifications: { userId: { toString(): string }; isRead: boolean }[] } })._dbData.notifications;
      const userNotifications = notifications.filter((n: { userId: { toString(): string } }) => n.userId.toString() === user.userId.toString());

      userNotifications.forEach((n: { isRead: boolean }) => {
        n.isRead = true;
      });

      return successResponse({ success: true });
    }

    await prisma.notification.updateMany({
      where: { userId: BigInt(user.userId), isRead: false },
      data: { isRead: true },
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error("Read all notifications error:", error);
    return errorResponse("Internal server error", 500);
  }
}
