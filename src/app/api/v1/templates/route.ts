import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const saveSoftwareSchema = z.object({
  action: z.literal("software").optional(),
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  status: z.enum(["Active", "Inactive"]).optional().default("Active"),
  columns_json: z.array(z.record(z.string(), z.unknown())),
});

const saveWorklistColumnsSchema = z.object({
  action: z.literal("worklist_columns"),
  columns: z.array(
    z.object({
      field_key: z.string().min(1),
      label: z.string().min(1),
      visible: z.boolean().default(true),
      sort_order: z.number().int().min(0),
    }),
  ),
});

const saveCustomFieldSchema = z.object({
  action: z.literal("custom_field"),
  field_key: z.string().min(1),
  label: z.string().min(1),
  field_type: z.enum(["text", "date", "days", "currency"]),
});

const postBodySchema = z.union([
  saveWorklistColumnsSchema,
  saveCustomFieldSchema,
  saveSoftwareSchema,
]);

function toSqlFieldType(t: "text" | "date" | "days" | "currency"): "text" | "number" | "date" | "select" {
  if (t === "days" || t === "currency") return "number";
  return t;
}

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

    const body = await parseJsonBody(req, postBodySchema);
    const supabase = await createSupabaseServerClient();

    if (body.action === "worklist_columns") {
      const { error: delError } = await supabase
        .from("worklist_columns")
        .delete()
        .eq("organization_id", ctx.organizationId);
      if (delError) throw delError;

      if (body.columns.length > 0) {
        const rows = body.columns.map((c) => ({
          organization_id: ctx.organizationId,
          field_key: c.field_key,
          label: c.label,
          visible: c.visible,
          sort_order: c.sort_order,
        }));
        const { error: insError } = await supabase.from("worklist_columns").insert(rows);
        if (insError) throw insError;
      }

      await writeAuditLog({
        organizationId: ctx.organizationId,
        actorUserId: ctx.userId,
        action: "worklist_columns.sync",
        resourceType: "worklist_columns",
      });

      return ok({ count: body.columns.length }, 200);
    }

    if (body.action === "custom_field") {
      const { data, error } = await supabase
        .from("custom_fields")
        .upsert(
          {
            organization_id: ctx.organizationId,
            field_key: body.field_key,
            label: body.label,
            field_type: toSqlFieldType(body.field_type),
            options: { appType: body.field_type },
          },
          { onConflict: "organization_id,field_key" },
        )
        .select()
        .single();

      if (error) throw error;

      await writeAuditLog({
        organizationId: ctx.organizationId,
        actorUserId: ctx.userId,
        action: "custom_field.upsert",
        resourceType: "custom_field",
        resourceId: data.id,
      });

      return ok(data, 201);
    }

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
