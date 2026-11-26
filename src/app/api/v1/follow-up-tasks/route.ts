import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission } from "@/server/auth/rbac";

const createTaskSchema = z.object({
  claim_id: z.string().uuid(),
  assigned_to: z.string().uuid().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(["Low", "Normal", "High", "Escalated"]).optional().default("Normal"),
  notes: z.string().max(1000).optional(),
});

const patchTaskSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["Open", "Completed", "Cancelled"]),
  notes: z.string().max(1000).optional(),
});

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.read");

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const mineOnly = url.searchParams.get("mine") === "true";

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("follow_up_tasks")
      .select("*, claims(claim_no, patient_name, balance_amount)")
      .eq("organization_id", ctx.organizationId)
      .order("due_date", { ascending: true });

    if (status) query = query.eq("status", status);
    if (mineOnly || ctx.roleKey === "ar_1" || ctx.roleKey === "ar_2") {
      query = query.eq("assigned_to", ctx.userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return ok(data ?? []);
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/follow-up-tasks" });
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.write");

    const body = await parseJsonBody(req, createTaskSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("follow_up_tasks")
      .insert({
        organization_id: ctx.organizationId,
        claim_id: body.claim_id,
        assigned_to: body.assigned_to ?? ctx.userId,
        due_date: body.due_date,
        priority: body.priority,
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return ok(data, 201);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/follow-up-tasks" });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.write");

    const body = await parseJsonBody(req, patchTaskSchema);
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("follow_up_tasks")
      .update({
        status: body.status,
        notes: body.notes,
        completed_at: body.status === "Completed" ? new Date().toISOString() : null,
      })
      .eq("id", body.id)
      .eq("organization_id", ctx.organizationId)
      .select()
      .single();

    if (error) throw error;
    return ok(data);
  } catch (err) {
    return handleApiError(err, { route: "PATCH /api/v1/follow-up-tasks" });
  }
}
