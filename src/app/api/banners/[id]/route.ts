import { NextResponse } from "next/server";
import { readFile } from "fs/promises";

// WSL mapped paths for the generated banners
const bannerPaths: Record<string, string> = {
  "1": "/mnt/c/Users/ADMIN/.gemini/antigravity/brain/518f3b54-d29e-4905-a393-c6bafc8e13d9/makele_hero_banner_1_1776164078376.png",
  "2": "/mnt/c/Users/ADMIN/.gemini/antigravity/brain/518f3b54-d29e-4905-a393-c6bafc8e13d9/makele_hero_banner_2_1776164095771.png",
  "3": "/mnt/c/Users/ADMIN/.gemini/antigravity/brain/518f3b54-d29e-4905-a393-c6bafc8e13d9/makele_hero_banner_3_1776164132420.png"
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params Promise (Next.js 15 requirement)
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const filePath = bannerPaths[id];
  if (!filePath) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    // readFile throws if file not present or inaccessible
    return new NextResponse("Not Found", { status: 404 });
  }
}
