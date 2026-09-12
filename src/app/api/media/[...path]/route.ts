import { NextRequest } from "next/server";
import { join } from "path";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const filename = resolvedParams.path.join("/");
    // We are serving files from the actual public/uploads directory.
    // This API route bypasses any Next.js static file cache issues.
    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), "public/uploads");
    const filePath = join(uploadDir, filename);

    const file = await fs.readFile(filePath);

    // Basic content type detection
    let contentType = "application/octet-stream";
    if (filename.endsWith(".png")) contentType = "image/png";
    else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
    else if (filename.endsWith(".webp")) contentType = "image/webp";
    else if (filename.endsWith(".gif")) contentType = "image/gif";

    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    // If the file doesn't exist, we must return a true 404 immediately
    return new Response("Not found", { status: 404 });
  }
}
