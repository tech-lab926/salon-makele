import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Authentication required", 401);

    const notifications = await prisma.notification.findMany({
      where: { userId: BigInt(user.userId) },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const serialized = notifications.map((n: any) => ({
      id: n.id.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      isRead: n.isRead,
      refId: n.refId?.toString() || null,
      refType: n.refType,
      createdAt: n.createdAt ? n.createdAt.toISOString() : new Date().toISOString(),
    }));

    return successResponse(serialized);
  } catch (error) {
    console.error("Notifications GET error:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return errorResponse("Authentication required", 401);

    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: BigInt(user.userId), isRead: false },
        data: { isRead: true },
      });
      return successResponse({ message: "All notifications marked as read" });
    }

    if (id) {
      // SECURITY: Must use updateMany here. prisma.update() only accepts @id / @@unique
      // fields in its `where` clause, so the `userId` guard above would be silently
      // ignored — any authenticated user could mark another user's notification as read.
      // updateMany applies a compound WHERE id = ? AND user_id = ? at the DB level.
      const result = await prisma.notification.updateMany({
        where: { id: BigInt(id), userId: BigInt(user.userId) },
        data: { isRead: true },
      });
      if (result.count === 0) {
        return errorResponse("Notification not found", 404);
      }
      return successResponse({ message: "Notification marked as read" });
    }

    return errorResponse("Provide id or markAllRead", 400);
  } catch (error) {
    console.error("Notifications PATCH error:", error);
    return errorResponse("Internal server error", 500);
  }
}
