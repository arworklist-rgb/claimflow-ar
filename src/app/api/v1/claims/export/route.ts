import ExcelJS from "exceljs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleApiError } from "@/server/api/response";
import { requireAuth, requirePermission, requirePracticeAccess, writeAuditLog } from "@/server/auth/rbac";

export async function GET(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.read");

    const url = new URL(req.url);
    const practiceId = url.searchParams.get("practiceId");
    if (practiceId) {
      requirePracticeAccess(ctx, practiceId);
    }

    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("claims")
      .select("claim_no, patient_name, service_date, billed_amount, paid_amount, balance_amount, action, submitted_status, denial_codes, responsible")
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .order("service_date", { ascending: false })
      .limit(5000);

    if (practiceId) query = query.eq("practice_id", practiceId);

    const { data, error } = await query;
    if (error) throw error;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Worklist");
    sheet.columns = [
      { header: "Claim No", key: "claim_no", width: 18 },
      { header: "Patient Name", key: "patient_name", width: 26 },
      { header: "Service Date", key: "service_date", width: 14 },
      { header: "Billed", key: "billed_amount", width: 12 },
      { header: "Paid", key: "paid_amount", width: 12 },
      { header: "Balance", key: "balance_amount", width: 12 },
      { header: "Action", key: "action", width: 18 },
      { header: "Submitted", key: "submitted_status", width: 12 },
      { header: "Denial Codes", key: "denial_codes", width: 20 },
      { header: "Responsible", key: "responsible", width: 18 },
    ];

    for (const row of data ?? []) {
      sheet.addRow({
        ...row,
        denial_codes: Array.isArray(row.denial_codes) ? row.denial_codes.join(", ") : "",
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    await writeAuditLog({
      organizationId: ctx.organizationId,
      actorUserId: ctx.userId,
      action: "claim.export",
      resourceType: "claim",
      metadata: { count: (data ?? []).length },
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="claimflow-worklist.xlsx"',
      },
    });
  } catch (err) {
    return handleApiError(err, { route: "GET /api/v1/claims/export" });
  }
}
