"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCheck, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  read_at?: string | null;
  created_at: string;
}

export function NotificationsView() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    email_assignments: true,
    email_followups: true,
    email_imports: true,
    in_app_enabled: true,
  });

  useEffect(() => {
    fetch("/api/v1/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j?.ok || !j.data) return;
        if (Array.isArray(j.data.notifications)) setItems(j.data.notifications);
        if (j.data.preferences) {
          setPrefs({
            email_assignments: Boolean(j.data.preferences.email_assignments),
            email_followups: Boolean(j.data.preferences.email_followups),
            email_imports: Boolean(j.data.preferences.email_imports),
            in_app_enabled: Boolean(j.data.preferences.in_app_enabled),
          });
        }
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkAllRead() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    await fetch("/api/v1/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    }).catch(() => {});
    toast.success("All notifications marked as read");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Real-time alerts for claim assignments, overdue follow-ups, and batch imports."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" /> Alert Preferences
            </CardTitle>
            <CardDescription>Persisted per user in PostgreSQL.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="n-assign"
                checked={prefs.email_assignments}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, email_assignments: Boolean(v) }))}
              />
              <Label htmlFor="n-assign">Email me when claims are assigned or escalated to me</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="n-followup"
                checked={prefs.email_followups}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, email_followups: Boolean(v) }))}
              />
              <Label htmlFor="n-followup">Daily digest for overdue AR follow-up tasks</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="n-imports"
                checked={prefs.email_imports}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, email_imports: Boolean(v) }))}
              />
              <Label htmlFor="n-imports">Notify when Excel / ERA 835 imports complete or fail</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="n-inapp"
                checked={prefs.in_app_enabled}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, in_app_enabled: Boolean(v) }))}
              />
              <Label htmlFor="n-inapp">Enable real-time in-app notification bell</Label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="mt-2">
              <Save className="size-4" /> {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">Notification History</CardTitle>
              <CardDescription>Live notifications for your user account.</CardDescription>
            </div>
            {items.some((n) => !n.read_at) && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
                <CheckCheck className="size-4" /> Mark all read
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 ? (
              <p className="text-muted-foreground py-4 text-sm">No notifications yet.</p>
            ) : (
              items.map((n) => (
                <div key={n.id} className="flex items-start justify-between gap-3 border-b pb-2.5 last:border-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-muted-foreground text-xs">{n.body}</div>
                    <div className="text-muted-foreground mt-0.5 text-[11px]">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  <Badge variant={n.read_at ? "secondary" : "default"}>
                    {n.read_at ? "Read" : "Unread"}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
