import { NextResponse } from "next/server";

interface RateLimitOptions {
  namespace: string;
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

type ParsedBody<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

const RATE_STORE_KEY = "__los_rate_limit_store__";

function getRateStore(): Map<string, RateLimitBucket> {
  const globalAny = globalThis as typeof globalThis & {
    [RATE_STORE_KEY]?: Map<string, RateLimitBucket>;
  };
  if (!globalAny[RATE_STORE_KEY]) {
    globalAny[RATE_STORE_KEY] = new Map<string, RateLimitBucket>();
  }
  return globalAny[RATE_STORE_KEY];
}

function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function rateLimit(request: Request, options: RateLimitOptions): RateLimitResult {
  const store = getRateStore();
  const now = Date.now();
  const ip = extractClientIp(request);
  const key = `${options.namespace}:${ip}`;
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (current.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);
  return {
    ok: true,
    remaining: Math.max(0, options.limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function rateLimitExceededResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export async function parseJsonBodyWithLimit<T>(request: Request, maxBytes: number): Promise<ParsedBody<T>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, status: 415, error: "Content-Type must be application/json" };
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const parsed = Number(contentLengthHeader);
    if (Number.isFinite(parsed) && parsed > maxBytes) {
      return { ok: false, status: 413, error: `Request body too large (max ${maxBytes} bytes)` };
    }
  }

  const raw = await request.text();
  if (!raw.trim()) {
    return { ok: false, status: 400, error: "Request body is required" };
  }

  const bytes = new TextEncoder().encode(raw).length;
  if (bytes > maxBytes) {
    return { ok: false, status: 413, error: `Request body too large (max ${maxBytes} bytes)` };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON body" };
  }
}
