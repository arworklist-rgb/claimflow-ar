import { ok } from "@/server/api/response";

export async function GET() {
  return ok({ status: "healthy", service: "claimflow-ar-api", timestamp: new Date().toISOString() });
}
