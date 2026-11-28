import { useDemoStore } from "@/lib/store/demo-store";
import type { CustomField, FieldType, Software, SoftwareColumn, WorklistColumn } from "@/lib/types";

interface TemplatesApiResponse {
  softwares: Array<{
    id: string;
    name: string;
    status: "Active" | "Inactive";
    columns_json: SoftwareColumn[];
  }>;
  customFields: Array<{
    id: string;
    field_key: string;
    label: string;
    field_type: string;
    options?: { appType?: FieldType } | null;
  }>;
  worklistColumns: Array<{
    id: string;
    field_key: string;
    label: string;
    visible: boolean;
    sort_order: number;
  }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapSqlTypeToApp(row: TemplatesApiResponse["customFields"][number]): FieldType {
  if (row.options?.appType) return row.options.appType;
  if (row.field_type === "date") return "date";
  if (row.field_type === "number") return "days";
  return "text";
}

export async function hydrateTemplatesFromSupabase(): Promise<void> {
  try {
    const res = await fetch("/api/v1/templates", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { data?: TemplatesApiResponse };
    const payload = json.data;
    if (!payload) return;

    const patch: Partial<{ softwares: Software[]; customFields: CustomField[]; worklistColumns: WorklistColumn[] }> = {};

    if (payload.softwares.length > 0) {
      patch.softwares = payload.softwares.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        columns: Array.isArray(s.columns_json) ? s.columns_json : [],
      }));
    }

    if (payload.customFields.length > 0) {
      patch.customFields = payload.customFields.map((f) => ({
        id: f.id,
        key: f.field_key,
        label: f.label,
        type: mapSqlTypeToApp(f),
      }));
    }

    if (payload.worklistColumns.length > 0) {
      patch.worklistColumns = payload.worklistColumns.map((w) => ({
        id: w.id,
        field: w.field_key,
        label: w.label,
        visible: w.visible,
      }));
    }

    if (Object.keys(patch).length > 0) {
      useDemoStore.setState(patch);
    }
  } catch {
    // Keep current store state if offline / unauthenticated
  }
}

export async function saveSoftwareToSupabase(software: Software): Promise<void> {
  try {
    await fetch("/api/v1/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "software",
        ...(UUID_RE.test(software.id) ? { id: software.id } : {}),
        name: software.name,
        status: software.status,
        columns_json: software.columns,
      }),
    });
  } catch {
    // Non-blocking fallback
  }
}

export async function saveWorklistColumnsToSupabase(columns: WorklistColumn[]): Promise<void> {
  try {
    await fetch("/api/v1/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "worklist_columns",
        columns: columns.map((c, idx) => ({
          field_key: c.field,
          label: c.label,
          visible: c.visible,
          sort_order: idx,
        })),
      }),
    });
  } catch {
    // Non-blocking fallback
  }
}

export async function saveCustomFieldToSupabase(field: CustomField): Promise<void> {
  try {
    await fetch("/api/v1/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "custom_field",
        field_key: field.key,
        label: field.label,
        field_type: field.type,
      }),
    });
  } catch {
    // Non-blocking fallback
  }
}
