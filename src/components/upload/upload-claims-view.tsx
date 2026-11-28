"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/use-auth";
import { useDemoStore } from "@/lib/store/demo-store";
import { hydrateTemplatesFromSupabase, saveSoftwareToSupabase } from "@/lib/supabase/templates-sync";
import { NewClaimsCard } from "./new-claims-card";
import { PaidClaimsCard } from "./paid-claims-card";
import { RecentUploads } from "./recent-uploads";

export function UploadClaimsView() {
  const { can, authenticated } = useAuth();
  const isAdmin = can("templates.manage");

  useEffect(() => {
    if (authenticated) {
      void hydrateTemplatesFromSupabase();
    }
  }, [authenticated]);

  const softwares = useDemoStore((s) => s.softwares);
  const practices = useDemoStore((s) => s.practices);
  const selectedPracticeId = useDemoStore((s) => s.selectedPracticeId);
  const addSoftware = useDemoStore((s) => s.addSoftware);

  const activeSoftwares = useMemo(() => softwares.filter((x) => x.status === "Active"), [softwares]);
  const selectedPractice = useMemo(
    () => (selectedPracticeId !== "all" ? practices.find((p) => p.id === selectedPracticeId) : undefined),
    [practices, selectedPracticeId],
  );

  const [softwareChoice, setSoftwareChoice] = useState("");
  const [addingSoftware, setAddingSoftware] = useState(false);
  const [newSoftwareName, setNewSoftwareName] = useState("");

  const software = useMemo(() => {
    if (softwareChoice) {
      const picked = activeSoftwares.find((x) => x.id === softwareChoice);
      if (picked) return picked;
    }
    if (selectedPractice?.softwareId) {
      const fromPractice = activeSoftwares.find((x) => x.id === selectedPractice.softwareId);
      if (fromPractice) return fromPractice;
    }
    return activeSoftwares[0];
  }, [activeSoftwares, softwareChoice, selectedPractice]);

  return (
    <>
      <PageHeader
        title="Upload Claims"
        description="Import claim data from Excel to create or update your worklist."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground hidden text-xs font-semibold uppercase sm:inline">
              Billing Software:
            </span>
            <Select value={software?.id ?? ""} onValueChange={setSoftwareChoice}>
              <SelectTrigger id="upload-billing-software" aria-label="Billing software" className="w-52 bg-card">
                <SelectValue placeholder="Select software" />
              </SelectTrigger>
              <SelectContent>
                {activeSoftwares.map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {x.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="bg-card"
                title="Add new billing software"
                onClick={() => setAddingSoftware(true)}
              >
                <Plus className="size-4" aria-hidden />
              </Button>
            )}
          </div>
        }
      />

      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <NewClaimsCard key={`new-${software?.id ?? "none"}`} software={software} />
        <PaidClaimsCard key={`paid-${software?.id ?? "none"}`} software={software} />
      </div>

      <RecentUploads />

      <Dialog open={addingSoftware} onOpenChange={setAddingSoftware}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = newSoftwareName.trim();
              if (!trimmed) return;
              const created = addSoftware(trimmed, software?.id);
              setSoftwareChoice(created.id);
              void saveSoftwareToSupabase(created);
              setNewSoftwareName("");
              setAddingSoftware(false);
              toast.success(`Added software "${created.name}"`);
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Add Billing Software</DialogTitle>
              <DialogDescription>Create a new software template starting from the current layout.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="quick-sw-name">Software Name</Label>
              <Input
                id="quick-sw-name"
                required
                autoFocus
                placeholder="e.g. NextGen"
                value={newSoftwareName}
                onChange={(e) => setNewSoftwareName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddingSoftware(false)}>
                Cancel
              </Button>
              <Button type="submit">Add &amp; Select</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
