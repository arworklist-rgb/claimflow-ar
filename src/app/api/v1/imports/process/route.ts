import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission, requirePracticeAccess, writeAuditLog } from "@/server/auth/rbac";
import { processNewClaimsImport, processPaidClaimsImport } from "@/server/services/claims";

const processImportSchema = z.discriminatedUnion("job_type", [
  z.object({
    job_type: z.literal("new_claims"),
    practice_id: z.string().uuid(),
    software_template_id: z.string().uuid().optional(),
    import_job_id: z.string().uuid().optional(),
    rows: z.array(
      z.object({
        claim_no: z.string(),
        patient_name: z.string(),
        patient_acct_no: z.string().optional(),
        service_date: z.string(),
        billed_amount: z.number().nonnegative(),
        responsible: z.string().optional(),
        extra_fields: z.record(z.string(), z.unknown()).optional(),
      }),
    ),
  }),
  z.object({
    job_type: z.literal("paid_claims"),
    import_job_id: z.string().uuid().optional(),
    rows: z.array(
      z.object({
        patient_acct_no: z.string().optional(),
        patient_name: z.string(),
        service_date: z.string(),
        payment_date: z.string(),
        transaction_by: z.string().optional(),
        paid_amount: z.number().positive(),
      }),
    ),
  }),
]);

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.import");

    const body = await parseJsonBody(req, processImportSchema);
    const supabase = await createSupabaseServerClient();

    if (body.job_type === "new_claims") {
      requirePracticeAccess(ctx, body.practice_id);
      const summary = await processNewClaimsImport({
        ctx,
        practiceId: body.practice_id,
        softwareTemplateId: body.software_template_id,
        rows: body.rows,
      });

      if (body.import_job_id) {
        await supabase
          .from("import_jobs")
          .update({
            status: summary.failed > 0 && summary.inserted === 0 && summary.updated === 0 ? "Failed" : "Completed",
            total_rows: body.rows.length,
            inserted_count: summary.inserted,
            updated_count: summary.updated,
            failed_count: summary.failed,
            completed_at: new Date().toISOString(),
          })
          .eq("id", body.import_job_id)
          .eq("organization_id", ctx.organizationId);

        if (summary.errors.length > 0) {
          await supabase.from("import_job_errors").insert(
            summary.errors.map((e) => ({ ...e, import_job_id: body.import_job_id! })),
          );
        }
      }

      await writeAuditLog({
        organizationId: ctx.organizationId,
        actorUserId: ctx.userId,
        action: "import.new_claims",
        resourceType: "import_job",
        resourceId: body.import_job_id,
        metadata: { inserted: summary.inserted, updated: summary.updated, failed: summary.failed },
      });

      return ok(summary);
    }

    const summary = await processPaidClaimsImport({ ctx, rows: body.rows });

    if (body.import_job_id) {
      await supabase
        .from("import_jobs")
        .update({
          status: "Completed",
          total_rows: body.rows.length,
          updated_count: summary.matched,
          failed_count: summary.unmatched,
          completed_at: new Date().toISOString(),
        })
        .eq("id", body.import_job_id)
        .eq("organization_id", ctx.organizationId);
    }

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "import.paid_claims",
      resourceType: "import_job",
      resourceId: body.import_job_id,
      metadata: summary,
    });

    return ok(summary);
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/imports/process" });
  }
}
