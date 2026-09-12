import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { getAuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
const MAX_SIZE = (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;
// Simple in-process concurrency limiter for CPU-heavy image processing.
const UPLOAD_CONCURRENCY = Number(process.env.UPLOAD_CONCURRENCY) || 2;
const globalUpload = globalThis as unknown as { __uploadQueue?: { count: number; queue: Array<() => void> } };
if (!globalUpload.__uploadQueue) globalUpload.__uploadQueue = { count: 0, queue: [] };
function acquireUploadSlot(): Promise<void> {
  const q = globalUpload.__uploadQueue!;
  if (q.count < UPLOAD_CONCURRENCY) {
    q.count += 1;
    return Promise.resolve();
  }
  return new Promise<void>((res) => q.queue.push(res));
}
function releaseUploadSlot(): void {
  const q = globalUpload.__uploadQueue!;
  q.count = Math.max(0, q.count - 1);
  const next = q.queue.shift();
  if (next) {
    q.count += 1;
    next();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    
    // Determine if this is a registration upload (unauthenticated)
    const isRegistration = request.headers.get("x-registration-upload") === "true";

    if (!user && !isRegistration) {
      return errorResponse("認証が必要です", 401);
    }
    
    if (user && user.role !== "artist" && user.role !== "admin") {
      return errorResponse("画像のアップロードはアーティストまたは管理者のみ可能です", 403);
    }

    // Rate limit: 10 uploads per user/IP per minute prevents CPU-exhaustion via sharp processing.
    const ip = clientIp(request);
    const rateLimitKey = user ? `upload:${user.userId}:${ip}` : `upload:anon:${ip}`;
    const uploadLimit = checkRateLimit(rateLimitKey, 10, 60_000);
    if (!uploadLimit.ok) {
      return errorResponse("アップロードの制限を超えました。少し待ってから再試行してください。", 429);
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("multipart/form-data 形式でファイルを送信してください", 400);
    }
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse("ファイルが選択されていません", 400);
    }
    if (file.size > MAX_SIZE) {
      return errorResponse(
        `ファイルサイズは${process.env.MAX_FILE_SIZE_MB || 10}MB以下にしてください`,
        413,
      );
    }

    const lowerName = file.name ? file.name.toLowerCase() : "";
    const bytes = await file.arrayBuffer();
    const input = Buffer.from(bytes);

    let processed: Buffer = input;
    let ext: string = "";

    const isDocument = lowerName.endsWith('.pdf') || lowerName.endsWith('.docx') || lowerName.endsWith('.doc');

    if (isDocument) {
      if (lowerName.endsWith('.pdf')) ext = "pdf";
      else if (lowerName.endsWith('.docx')) ext = "docx";
      else ext = "doc";
    } else {
      try {
        await acquireUploadSlot();
        const img = sharp(input, { failOn: "truncated" });
        const meta = await img.metadata();
        const fmt = meta.format;

        const baseImg = sharp(input).rotate().resize({
          width: 1200,
          height: 1200,
          fit: "inside",
          withoutEnlargement: true,
        });

        if (fmt === "jpeg") {
          processed = await baseImg.jpeg({ mozjpeg: true, quality: 88 }).toBuffer();
          ext = "jpg";
        } else if (fmt === "png") {
          processed = await baseImg.png({ compressionLevel: 9 }).toBuffer();
          ext = "png";
        } else if (fmt === "webp") {
          processed = await baseImg.webp({ quality: 88 }).toBuffer();
          ext = "webp";
        } else if (fmt === "gif") {
          processed = await sharp(input).gif().toBuffer();
          ext = "gif";
        } else {
          return errorResponse(
            "対応していないファイル形式です（画像またはPDF/DOCXのみ）",
            400,
          );
        }
      } catch {
        return errorResponse(
          "画像として読み込めませんでした。有効な画像ファイルを選択してください",
          400,
        );
      } finally {
        releaseUploadSlot();
      }
    }

    const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

    const uploadDir =
      process.env.UPLOAD_DIR || join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(join(uploadDir, filename), processed);

    const url = `/uploads/${filename}`;

    return successResponse({ url, filename });
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse("アップロードに失敗しました", 500);
  }
}
