import { NextResponse } from "next/server";

function cacheControlHeader(maxAgeSec: number) {
  return `public, s-maxage=${maxAgeSec}, stale-while-revalidate=${maxAgeSec * 2}`;
}

/**
 * Deeply serializes BigInt values to strings to prevent JSON.stringify errors.
 * This is faster and safer than manual conversion in every API route.
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInt);
  if (typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = serializeBigInt(obj[key]);
    }
    return newObj;
  }
  return obj;
}

export function successResponse<T>(
  data: T,
  status = 200,
  opts?: { cacheSeconds?: number; skipSerialization?: boolean },
) {
  const headers = new Headers();
  if (opts?.cacheSeconds != null) {
    headers.set("Cache-Control", cacheControlHeader(opts.cacheSeconds));
  }
  return NextResponse.json(
    { success: true, data: opts?.skipSerialization ? data : serializeBigInt(data) },
    { status, headers },
  );
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  opts?: { cacheSeconds?: number; skipSerialization?: boolean },
) {
  const headers = new Headers();
  if (opts?.cacheSeconds != null) {
    headers.set("Cache-Control", cacheControlHeader(opts.cacheSeconds));
  }
  return NextResponse.json(
    {
      success: true,
      data: opts?.skipSerialization ? data : serializeBigInt(data),
      pagination: {
        total: Number(total),
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
      },
    },
    { headers },
  );
}
