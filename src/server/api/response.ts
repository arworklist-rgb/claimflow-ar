import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function parseJsonBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.flatten());
  }
  return parsed.data;
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function handleApiError(err: unknown, context?: { route?: string; userId?: string }) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: { code: err.code, message: err.message, details: err.details } },
      { status: err.status },
    );
  }

  if (err instanceof ZodError) {
    return NextResponse.json(
      { ok: false, error: { code: "VALIDATION_ERROR", message: "Validation failed.", details: err.flatten() } },
      { status: 422 },
    );
  }

  const message = err instanceof Error ? err.message : "Unexpected internal server error";
  // Structured log without PHI
  console.error(
    JSON.stringify({
      level: "error",
      route: context?.route ?? "unknown",
      userId: context?.userId ?? null,
      message,
      timestamp: new Date().toISOString(),
    }),
  );

  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "An internal error occurred." } },
    { status: 500 },
  );
}
