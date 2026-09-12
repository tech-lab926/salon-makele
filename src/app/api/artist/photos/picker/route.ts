import { NextRequest } from "next/server";
import { getAuthUser, normalizeRole } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";

export const dynamic = "force-dynamic";

// Create a new Google Photos Picker Session
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || normalizeRole(authUser.role) !== "artist") {
      return errorResponse("Unauthorized", 401);
    }
    
    const userIdRaw = authUser.userId;
    if (!userIdRaw || !/^\d+$/.test(String(userIdRaw))) return errorResponse("Invalid User ID", 401);
    
    const userId = BigInt(String(userIdRaw));
    const account = await prisma.account.findFirst({ where: { provider: "google", userId }, orderBy: { id: "desc" } });
    const accessToken = account?.access_token;
    
    if (!accessToken) return errorResponse("Google Photos access token not found", 403);
    
    const res = await fetch("https://photospicker.googleapis.com/v1/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("Photos Picker Session Error:", errorData);
      const status = res.status === 401 || res.status === 403 ? res.status : 500;
      return errorResponse(
        status === 500 ? "Failed to create picker session" : "Google Photos access token not found", 
        status
      );
    }
    
    const data = await res.json();
    return successResponse({
      sessionId: data.id,
      pickerUri: data.pickerUri
    });
  } catch (error) {
    console.error("POST /picker error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// Check session status and fetch picked items
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || normalizeRole(authUser.role) !== "artist") {
      return errorResponse("Unauthorized", 401);
    }
    
    const sessionId = request.nextUrl.searchParams.get("sessionId");
    if (!sessionId) return errorResponse("Session ID required", 400);

    const userIdRaw = authUser.userId;
    if (!userIdRaw || !/^\d+$/.test(String(userIdRaw))) return errorResponse("Invalid User ID", 401);
    
    const userId = BigInt(String(userIdRaw));
    const account = await prisma.account.findFirst({ where: { provider: "google", userId }, orderBy: { id: "desc" } });
    const accessToken = account?.access_token;
    
    if (!accessToken) return errorResponse("Google Photos access token not found", 403);
    
    // 1. Get session status
    const sessionRes = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });
    
    if (!sessionRes.ok) {
      console.error("Session status fetch failed:", await sessionRes.text());
      const status = sessionRes.status === 401 || sessionRes.status === 403 ? sessionRes.status : 500;
      return errorResponse(
        status === 500 ? "Failed to fetch session" : "Google Photos access token not found",
        status
      );
    }
    
    const sessionData = await sessionRes.json();
    
    // 2. If items are picked, fetch and download the image
    if (sessionData.mediaItemsSet) {
      const itemsRes = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });
      
      if (!itemsRes.ok) {
        console.error("Media items fetch failed:", await itemsRes.text());
        return errorResponse("Failed to fetch items", 500);
      }
      
      const itemsData = await itemsRes.json();
      const baseUrl = itemsData.mediaItems?.[0]?.mediaFile?.baseUrl || itemsData.mediaItems?.[0]?.baseUrl;
      
      if (!baseUrl) {
        return errorResponse("No media item URL found", 500);
      }

      // 3. Download the image using the access token (it's a private authenticated URL)
      const imgRes = await fetch(baseUrl, {
        headers: { "Authorization": `Bearer ${accessToken}` }
      });

      if (!imgRes.ok) {
        console.error("Image download failed:", imgRes.status, await imgRes.text());
        return errorResponse("Failed to download image from Google Photos", 500);
      }

      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";

      // 4. Save to local uploads directory (same as the existing upload route)
      const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), "public/uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(join(uploadDir, filename), imgBuffer);

      const url = `/uploads/${filename}`;
      console.log("Saved Google Photos image to:", url);

      return successResponse({ mediaItemsSet: true, url });
    }
    
    return successResponse({ mediaItemsSet: false });
  } catch (error) {
    console.error("GET /picker error:", error);
    return errorResponse("Internal server error", 500);
  }
}

// Delete a previously downloaded Google Photos image when user removes it from the form
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser || normalizeRole(authUser.role) !== "artist") {
      return errorResponse("Unauthorized", 401);
    }

    const file = request.nextUrl.searchParams.get("file");
    if (!file || file.includes("..") || file.includes("/")) {
      return errorResponse("Invalid filename", 400);
    }

    const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), "public/uploads");
    const filePath = join(uploadDir, file);

    try {
      await unlink(filePath);
      console.log("Deleted Google Photos image:", filePath);
    } catch {
      // File may already be gone, that's fine
    }

    return successResponse({ deleted: true });
  } catch (error) {
    console.error("DELETE /picker error:", error);
    return errorResponse("Internal server error", 500);
  }
}

