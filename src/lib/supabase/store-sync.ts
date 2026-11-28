import { useDemoStore } from "@/lib/store/demo-store";
import { hydrateTemplatesFromSupabase } from "@/lib/supabase/templates-sync";
import type { Claim, DenialCategory, DenialCode, HelpContact, KnowledgeDoc, Practice, UploadLog, User } from "@/lib/types";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T };
    return json.data ?? null;
  } catch {
    return null;
  }
}

let hydratedOnce = false;

export async function hydrateAllFromSupabase(force = false): Promise<void> {
  if (hydratedOnce && !force) return;
  hydratedOnce = true;

  await Promise.all([
    hydrateTemplatesFromSupabase(),
    (async () => {
      const rows = await fetchJson<
        Array<{
          id: string;
          code: string;
          name: string;
          npi?: string | null;
          status: "Active" | "Inactive";
          software_template_id?: string | null;
          created_at: string;
        }>
      >("/api/v1/practices");
      if (rows && rows.length > 0) {
        const practices: Practice[] = rows.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          npi: r.npi ?? undefined,
          softwareId: r.software_template_id ?? undefined,
          status: r.status,
          userIds: [],
          createdAt: r.created_at,
        }));
        useDemoStore.setState({ practices });
      }
    })(),
    (async () => {
      const payload = await fetchJson<{ items: Array<Record<string, unknown>> }>("/api/v1/claims?limit=100");
      if (payload?.items && payload.items.length > 0) {
        const practicesById = new Map(useDemoStore.getState().practices.map((p) => [p.id, p.name]));
        const claims: Claim[] = payload.items.map((r) => {
          const practiceId = String(r.practice_id ?? "");
          return {
            id: String(r.id),
            claimId: String(r.claim_no ?? ""),
            practiceId,
            practiceName: practicesById.get(practiceId) ?? String(r.practice_name ?? "Practice"),
            patientName: String(r.patient_name ?? ""),
            patientAcctNo: r.patient_acct_no ? String(r.patient_acct_no) : undefined,
            dos: String(r.service_date ?? ""),
            claimDate: r.claim_date ? String(r.claim_date) : "",
            billedDate: r.billed_date ? String(r.billed_date) : "",
            responsible: String(r.responsible ?? ""),
            provider: r.provider ? String(r.provider) : "",
            cpt: r.cpt ? String(r.cpt) : "",
            billedAmount: Number(r.billed_amount ?? 0),
            paidAmount: r.paid_amount !== null && r.paid_amount !== undefined ? Number(r.paid_amount) : undefined,
            balance: r.balance !== null && r.balance !== undefined ? Number(r.balance) : Number(r.billed_amount ?? 0),
            denialCodes: Array.isArray(r.denial_codes) ? (r.denial_codes as string[]) : [],
            action: (r.action as Claim["action"]) ?? "New",
            submittedStatus: (r.submission_status as Claim["submittedStatus"]) ?? "First",
            ar1UserId: r.ar1_user_id ? String(r.ar1_user_id) : undefined,
            ar2UserId: r.ar2_user_id ? String(r.ar2_user_id) : undefined,
            transactionBy: r.transaction_by ? String(r.transaction_by) : undefined,
            paidOn: r.paid_on ? String(r.paid_on) : undefined,
            createdAt: r.created_at ? String(r.created_at) : undefined,
            extra: (r.extra_fields as Record<string, string>) ?? undefined,
            history: [],
          };
        });
        useDemoStore.setState({ claims });
      }
    })(),
    (async () => {
      const rows = await fetchJson<
        Array<{ id: string; code: string; description: string; category: string; status: "Active" | "Inactive" }>
      >("/api/v1/denial-codes");
      if (rows && rows.length > 0) {
        const denialCodes: DenialCode[] = rows.map((r) => ({
          id: r.id,
          code: r.code,
          description: r.description,
          category: r.category as DenialCategory,
          status: r.status,
        }));
        useDemoStore.setState({ denialCodes });
      }
    })(),
    (async () => {
      const payload = await fetchJson<{
        users?: Array<{
          id: string;
          full_name: string;
          email: string;
          status: "Active" | "Inactive";
          role?: { key?: string } | null;
        }>;
      }>("/api/v1/users");
      if (payload?.users && payload.users.length > 0) {
        const users: User[] = payload.users.map((u, idx) => ({
          id: u.id,
          name: u.full_name,
          email: u.email,
          role: (u.role?.key as User["role"]) ?? "AR Specialist",
          status: u.status,
          colorIndex: idx % 8,
        }));
        useDemoStore.setState({ users });
      }
    })(),
    (async () => {
      const rows = await fetchJson<
        Array<{
          id: string;
          name: string;
          category?: HelpContact["category"];
          practice_id?: string | null;
          phones_json?: HelpContact["phones"];
          email?: string | null;
          website?: string | null;
          hours?: string | null;
          notes?: string | null;
        }>
      >("/api/v1/help-contacts");
      if (rows && rows.length > 0) {
        const helpContacts: HelpContact[] = rows.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category ?? "Other",
          practiceId: r.practice_id ?? undefined,
          phones: Array.isArray(r.phones_json) ? r.phones_json : [],
          email: r.email ?? undefined,
          website: r.website ?? undefined,
          hours: r.hours ?? undefined,
          notes: r.notes ?? undefined,
        }));
        useDemoStore.setState({ helpContacts });
      }
    })(),
    (async () => {
      const rows = await fetchJson<
        Array<{
          id: string;
          title: string;
          category: KnowledgeDoc["category"];
          description?: string | null;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          uploaded_by?: string | null;
          uploaded_by_name?: string | null;
          created_at: string;
        }>
      >("/api/v1/documents");
      if (rows && rows.length > 0) {
        const knowledgeDocs: KnowledgeDoc[] = rows.map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          description: d.description ?? undefined,
          fileName: d.file_name,
          ext: d.file_name.split(".").pop()?.toLowerCase() ?? "pdf",
          mimeType: d.mime_type ?? "application/octet-stream",
          size: d.file_size ?? 0,
          uploadedById: d.uploaded_by ?? "",
          uploadedByName: d.uploaded_by_name ?? "Admin",
          uploadedAt: d.created_at,
        }));
        useDemoStore.setState({ knowledgeDocs });
      }
    })(),
    (async () => {
      const rows = await fetchJson<
        Array<{
          id: string;
          file_name: string;
          upload_type: "New" | "Paid";
          practice_name?: string | null;
          total_rows: number;
          uploaded_by_name?: string | null;
          created_at: string;
          status?: UploadLog["status"];
        }>
      >("/api/v1/imports");
      if (rows && rows.length > 0) {
        const uploadLogs: UploadLog[] = rows.map((u) => ({
          id: u.id,
          fileName: u.file_name,
          type: u.upload_type,
          practiceName: u.practice_name ?? "—",
          rows: u.total_rows,
          uploadedBy: u.uploaded_by_name ?? "User",
          uploadedAt: u.created_at,
          status: u.status ?? "Completed",
        }));
        useDemoStore.setState({ uploadLogs });
      }
    })(),
  ]);
}
