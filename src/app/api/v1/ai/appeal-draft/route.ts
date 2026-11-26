import { z } from "zod";
import { handleApiError, ok, parseJsonBody } from "@/server/api/response";
import { requireAuth, requirePermission } from "@/server/auth/rbac";

const appealDraftSchema = z.object({
  claim_no: z.string().min(1),
  patient_name: z.string().min(1),
  service_date: z.string().min(1),
  billed_amount: z.number().nonnegative(),
  denial_codes: z.array(z.string()).min(1),
  payer_name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const ctx = await requireAuth();
    requirePermission(ctx, "claims.write");

    const body = await parseJsonBody(req, appealDraftSchema);
    const codesList = body.denial_codes.join(", ");

    const draft = [
      `RE: Formal Claim Appeal — Claim #${body.claim_no}`,
      `Patient: ${body.patient_name} | Date of Service: ${body.service_date}`,
      `Payer: ${body.payer_name ?? "Insurance Carrier"} | Billed Amount: $${body.billed_amount.toFixed(2)}`,
      "",
      `Dear Claims Review Department,`,
      "",
      `We are formally appealing the denial of Claim #${body.claim_no} under denial code(s): ${codesList}.`,
      `Attached are the supporting clinical documentation, itemized statement, and coding verification demonstrating medical necessity and timely submission.`,
      "",
      `Please reprocess this claim for full reimbursement at your earliest convenience.`,
    ].join("\n");

    return ok({
      claim_no: body.claim_no,
      denial_codes: body.denial_codes,
      recommended_action: "Resubmitted",
      draft_letter: draft,
    });
  } catch (err) {
    return handleApiError(err, { route: "POST /api/v1/ai/appeal-draft" });
  }
}
