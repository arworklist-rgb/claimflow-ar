const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: string) => UUID_RE.test(id);

export async function syncApi(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<void> {
  try {
    await fetch(url, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Non-blocking fallback for offline/demo mode
  }
}
