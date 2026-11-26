import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, writeAuditLog } from "@/server/auth/rbac";

const createContactSchema = z.object({
  practice_id: z.string().uuid().nullable().optional(),
  category: z.string().min(1).max(60),
  name: z.string().min(1).max(160),
  phones: z.array(z.object({ type: z.string(), number: z.string() })).optional().default([]),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  hours: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});

export async function GET() {
  try {
    const ctx = await requireAuth();
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("help_contacts")
      .select("*")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/help-contacts" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "helpdesk.manage");

    const body = await parseJsonBody(req, createContactSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("help_contacts")
      .insert({ ...body, organization_id: ctx.organizationId })
      .select()
      .single();

    if (error) throw error;

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "help_contact.create",
      resourceType: "help_contact",
      resourceId: data.id,
    });

    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/help-contacts" });
  }
}
