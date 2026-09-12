/**
 * LINE Messaging Helper
 */

export async function sendLineMessage(lineUserId: string, messageText: string): Promise<boolean> {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.warn("LINE_CHANNEL_ACCESS_TOKEN is missing. LINE notification skipped.");
    return false;
  }

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [
          {
            type: "text",
            text: messageText,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("LINE Messaging API error:", errorData);
      return false;
    }

    console.log(`LINE message successfully sent to user ${lineUserId}`);
    return true;
  } catch (error) {
    console.error("Failed to send LINE message:", error);
    return false;
  }
}
