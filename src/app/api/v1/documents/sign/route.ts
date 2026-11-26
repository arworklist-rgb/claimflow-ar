import { z } from "zod";
import { createSignedUploadParams } from "@/lib/cloudinary/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission } from "@/server/auth/rbac";

const signSchema = z.object({
  folder: z.enum(["knowledge", "imports", "remittances"]),
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    const body = await parseJsonBody(req, signSchema);

    if (body.folder === "knowledge") {
      requirePermission(ctx, "documents.manage");
    } else {
      requirePermission(ctx, "claims.import");
    }

    const signed = createSignedUploadParams(ctx.organizationId, body.folder);
    return ok(signed);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/documents/sign" });
  }
}
