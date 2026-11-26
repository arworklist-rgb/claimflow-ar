import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const saveSoftwareSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  columns_json: z.array(z.record(z.string(), z.unknown())),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const [softwares, customFields, worklistColumns] = await Promise.all([
      supabase.from("software_templates").select("*").eq("organization_id", ctx.organizationId).order("name"),
      supabase.from("custom_fields").select("*").eq("organization_id", ctx.organizationId).order("label"),
      supabase.from("worklist_columns").select("*").eq("organization_id", ctx.organizationId).order("sort_order"),
    ]);

    if (softwares.error) throw softwares.error;
    if (customFields.error) throw customFields.error;
    if (worklistColumns.error) throw worklistColumns.error;

    return ok({
      softwares: softwares.data ?? [],
      customFields: customFields.data ?? [],
      worklistColumns: worklistColumns.data ?? [],
    });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/templates" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "templates.manage");

    const body = await parseJsonBody(req, saveSoftwareSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("software_templates")
      .upsert({
        ...(body.id ? { id: body.id } : {}),
        organization_id: ctx.organizationId,
        name: body.name,
        status: body.status,
        columns_json: body.columns_json,
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "template.upsert",
      resourceType: "software_template",
      resourceId: data.id,
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/templates" });
  }
}
