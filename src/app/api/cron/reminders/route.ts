import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { 
  sendEmail, 
  bookingReminderEmailForUser, 
  bookingReminderEmailForArtist,
  booking3DayReminderEmailForUser,
  booking3DayReminderEmailForArtist
} from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    // Basic protection: Require a CRON_SECRET matching the environment variable
    const authHeader = request.headers.get("authorization");
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return errorResponse("Unauthorized", 401);
    }

    let totalSentCount = 0;
    const CONCURRENCY = 8;
    const offsets = [1, 3]; // 1 day and 3 days

    for (const daysAhead of offsets) {
      // Determine target date in JST
      const targetDate = new Date();
      targetDate.setUTCHours(targetDate.getUTCHours() + 9 + (24 * daysAhead));
      
      // Create Date objects for the start and end of target day to query @db.Date
      const year = targetDate.getUTCFullYear();
      const month = targetDate.getUTCMonth();
      const date = targetDate.getUTCDate();
      const startDate = new Date(Date.UTC(year, month, date, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, date, 23, 59, 59));

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          status: "CONFIRMED",
          availability: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        include: {
          user: true,
          artist: {
            include: {
              user: true,
            },
          },
          availability: true,
        },
      });

      for (let i = 0; i < upcomingBookings.length; i += CONCURRENCY) {
        const batch = upcomingBookings.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map(async (booking: any) => {
            const dateStr = booking.availability.date.toISOString().split("T")[0];
            const timeStr = booking.availability.startTime.toISOString().slice(11, 16);

            const tasks: Promise<unknown>[] = [];

            // Email text routing
            const is3Day = daysAhead === 3;
            const lineDateText = is3Day ? "3日後" : "明日";

            // Send to User
            if (booking.user?.email) {
              const userEmailContent = is3Day 
                ? booking3DayReminderEmailForUser(booking.user.name, booking.artist.displayName, dateStr, timeStr)
                : bookingReminderEmailForUser(booking.user.name, booking.artist.displayName, dateStr, timeStr);
              
              tasks.push(
                sendEmail({
                  to: booking.user.email,
                  ...userEmailContent,
                }).catch((e) => console.error("Failed to send user email reminder:", e))
              );
            }

            // Send LINE notification to User
            if (booking.user?.lineUserId) {
              const lineMessage = `【予約リマインド】\n${booking.user.name}様、${lineDateText} ${dateStr} ${timeStr} より、${booking.artist.displayName}様との施術予約が入っています。\nご来店をお待ちしております。`;
              tasks.push(
                import("@/lib/line").then(({ sendLineMessage }) =>
                  sendLineMessage(booking.user.lineUserId!, lineMessage)
                ).catch((e) => console.error("Failed to send user LINE reminder:", e))
              );
            }

            // Send to Artist
            if (booking.artist?.user?.email) {
              const artistEmailContent = is3Day
                ? booking3DayReminderEmailForArtist(booking.artist.displayName, booking.user.name, dateStr, timeStr)
                : bookingReminderEmailForArtist(booking.artist.displayName, booking.user.name, dateStr, timeStr);

              tasks.push(
                sendEmail({
                  to: booking.artist.user.email,
                  ...artistEmailContent,
                }).catch((e) => console.error("Failed to send artist email reminder:", e))
              );
            }

            // Send LINE notification to Artist
            if (booking.artist?.user?.lineUserId) {
              const lineMessage = `【予約リマインド】\n${booking.artist.displayName}様、${lineDateText} ${dateStr} ${timeStr} より、${booking.user.name}様の施術予約が入っています。`;
              tasks.push(
                import("@/lib/line").then(({ sendLineMessage }) =>
                  sendLineMessage(booking.artist.user.lineUserId!, lineMessage)
                ).catch((e) => console.error("Failed to send artist LINE reminder:", e))
              );
            }

            await Promise.all(tasks);
            totalSentCount++;
          })
        );
      }
    }

    return successResponse({
      message: `Sent ${totalSentCount} reminder(s) total across all offsets.`,
      count: totalSentCount,
    });
  } catch (error) {
    console.error("Cron reminders error:", error);
    return errorResponse("Internal server error", 500);
  }
}
