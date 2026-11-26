export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.ok) {
    const msg = !json.ok ? json.error.message : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json.data;
}

export const apiClient = {
  health: () => request<{ status: string; timestamp: string }>("/api/v1/health"),

  claims: {
    list: (params?: { practiceId?: string; action?: string; q?: string; page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.practiceId) qs.set("practiceId", params.practiceId);
      if (params?.action) qs.set("action", params.action);
      if (params?.q) qs.set("q", params.q);
      if (params?.page) qs.set("page", String(params.page));
      if (params?.limit) qs.set("limit", String(params.limit));
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<{ items: unknown[]; total: number; page: number; limit: number }>(`/api/v1/claims${suffix}`);
    },
    update: (id: string, body: Record<string, unknown>) =>
      request(`/api/v1/claims/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },

  practices: {
    list: () => request<unknown[]>("/api/v1/practices"),
    create: (body: Record<string, unknown>) =>
      request("/api/v1/practices", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request(`/api/v1/practices/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id: string) => request(`/api/v1/practices/${id}`, { method: "DELETE" }),
  },

  denialCodes: {
    list: () => request<unknown[]>("/api/v1/denial-codes"),
    create: (body: Record<string, unknown>) =>
      request("/api/v1/denial-codes", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request(`/api/v1/denial-codes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id: string) => request(`/api/v1/denial-codes/${id}`, { method: "DELETE" }),
  },

  helpContacts: {
    list: () => request<unknown[]>("/api/v1/help-contacts"),
    create: (body: Record<string, unknown>) =>
      request("/api/v1/help-contacts", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request(`/api/v1/help-contacts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id: string) => request(`/api/v1/help-contacts/${id}`, { method: "DELETE" }),
  },

  documents: {
    list: () => request<unknown[]>("/api/v1/documents"),
    signUpload: (folder: "knowledge" | "imports" | "remittances") =>
      request<{
        cloudName: string;
        apiKey: string;
        timestamp: number;
        signature: string;
        folder: string;
        resourceType: "raw";
        type: "authenticated";
      }>("/api/v1/documents/sign", { method: "POST", body: JSON.stringify({ folder }) }),
    create: (body: Record<string, unknown>) =>
      request("/api/v1/documents", { method: "POST", body: JSON.stringify(body) }),
    downloadUrl: (id: string) =>
      request<{ url: string; fileName: string; expiresInSeconds: number }>(`/api/v1/documents/${id}/download`),
    remove: (id: string) => request(`/api/v1/documents/${id}`, { method: "DELETE" }),
  },

  imports: {
    list: () => request<unknown[]>("/api/v1/imports"),
    createJob: (body: Record<string, unknown>) =>
      request("/api/v1/imports", { method: "POST", body: JSON.stringify(body) }),
    process: (body: Record<string, unknown>) =>
      request("/api/v1/imports/process", { method: "POST", body: JSON.stringify(body) }),
  },

  templates: {
    getAll: () => request<{ softwares: unknown[]; customFields: unknown[]; worklistColumns: unknown[] }>("/api/v1/templates"),
    upsertSoftware: (body: Record<string, unknown>) =>
      request("/api/v1/templates", { method: "POST", body: JSON.stringify(body) }),
  },
};
