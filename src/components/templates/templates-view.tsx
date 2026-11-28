"use client";

import { useEffect, useMemo, useState } from "react";
import { Columns3, FileSpreadsheet, Lock, Plus, Save, Shapes } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/use-auth";
import { useDemoStore } from "@/lib/store/demo-store";
import { hydrateTemplatesFromSupabase, saveSoftwareToSupabase, saveWorklistColumnsToSupabase } from "@/lib/supabase/templates-sync";
import { DEFAULT_WORKLIST_COLUMNS, MANUAL_DATA_INPUT, uidShort, validateSoftware } from "@/lib/templates";
import type { SoftwareColumn, WorklistColumn } from "@/lib/types";
import { CustomFieldsTab } from "./custom-fields-tab";
import { SoftwareTab } from "./software-tab";
import { WorklistColumnsTab } from "./worklist-columns-tab";

function deriveWorklistColumns(
  savedCols: WorklistColumn[] | undefined,
  softwareCols: SoftwareColumn[],
  fallbackCols: WorklistColumn[],
): WorklistColumn[] {
  if (savedCols && savedCols.length > 0) return savedCols;
  if (softwareCols.length > 0) {
    return softwareCols
      .filter((c) => !c.hidden && c.field)
      .map((c) => ({
        id: uidShort("wc"),
        label: c.header || c.field,
        field: c.field,
        visible: true,
      }));
  }
  return fallbackCols.length > 0 ? fallbackCols : DEFAULT_WORKLIST_COLUMNS;
}

/** Settings > Worklist Settings. Super users (admins) edit it; everyone else can look. */
export function TemplatesView() {
  const { can, authenticated } = useAuth();
  const isAdmin = can("templates.manage");

  useEffect(() => {
    if (authenticated) {
      void hydrateTemplatesFromSupabase();
    }
  }, [authenticated]);

  const softwares = useDemoStore((s) => s.softwares);
  const customFields = useDemoStore((s) => s.customFields);
  const globalWorklistColumns = useDemoStore((s) => s.worklistColumns);
  const addSoftware = useDemoStore((s) => s.addSoftware);
  const updateSoftware = useDemoStore((s) => s.updateSoftware);
  const setWorklistColumns = useDemoStore((s) => s.setWorklistColumns);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeSoftware = softwares.find((x) => x.id === selectedId) ?? softwares[0];

  const [draftColumns, setDraftColumns] = useState<SoftwareColumn[] | null>(null);
  const [draftWorklistCols, setDraftWorklistCols] = useState<WorklistColumn[] | null>(null);
  const [softwareSwitched, setSoftwareSwitched] = useState(false);

  const [adding, setAdding] = useState(false);
  const [newSwName, setNewSwName] = useState("");
  const [copyFrom, setCopyFrom] = useState("sw-standard");

  const currentColumns = useMemo(() => {
    const base = draftColumns ?? activeSoftware?.columns ?? [];
    const existingFields = new Set(base.map((c) => c.field));
    const additions: SoftwareColumn[] = globalWorklistColumns
      .filter((wc) => wc.field && !existingFields.has(wc.field))
      .map((wc) => ({
        id: `col-${wc.id}`,
        field: wc.field,
        header: MANUAL_DATA_INPUT,
        aliases: [],
        required: false,
      }));
    return additions.length > 0 ? [...base, ...additions] : base;
  }, [draftColumns, activeSoftware, globalWorklistColumns]);
  const currentWorklistCols = useMemo(
    () =>
      draftWorklistCols ??
      deriveWorklistColumns(activeSoftware?.worklistColumns, currentColumns, globalWorklistColumns),
    [draftWorklistCols, activeSoftware, currentColumns, globalWorklistColumns],
  );

  const errors = useMemo(
    () =>
      activeSoftware
        ? validateSoftware({ name: activeSoftware.name, columns: currentColumns }, customFields, softwares, activeSoftware.id)
        : [],
    [activeSoftware, currentColumns, customFields, softwares],
  );

  const dirty =
    softwareSwitched ||
    draftColumns !== null ||
    draftWorklistCols !== null;

  function handleSwitchSoftware(nextId: string) {
    setSelectedId(nextId);
    setDraftColumns(null);
    setDraftWorklistCols(null);
    setSoftwareSwitched(true);
  }

  function handleSaveAll() {
    if (!activeSoftware) return;
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }
    const cleanColumns = currentColumns.map((c) => ({
      ...c,
      header: c.header.trim(),
      aliases: c.aliases.map((a) => a.trim()).filter(Boolean),
    }));
    updateSoftware(activeSoftware.id, {
      name: activeSoftware.name,
      status: activeSoftware.status,
      columns: cleanColumns,
      worklistColumns: currentWorklistCols,
    });
    setWorklistColumns(currentWorklistCols);
    void saveSoftwareToSupabase({
      ...activeSoftware,
      columns: cleanColumns,
    });
    void saveWorklistColumnsToSupabase(currentWorklistCols);
    setDraftColumns(null);
    setDraftWorklistCols(null);
    setSoftwareSwitched(false);
    toast.success(`Saved settings for ${activeSoftware.name}`);
  }

  const tab = "px-3 text-sm font-semibold sm:px-4 sm:text-[15px] data-active:text-primary h-full flex-none gap-2";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Worklist Settings"
        description="Each billing software exports its own Excel layout. Set up its columns and names here, choose what the worklist displays, and add fields of your own."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {activeSoftware && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground hidden text-xs font-semibold uppercase sm:inline">
                  Billing Software:
                </span>
                <Select value={activeSoftware.id} onValueChange={handleSwitchSoftware}>
                  <SelectTrigger aria-label="Billing software" className="w-52 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {softwares.map((x) => (
                      <SelectItem key={x.id} value={x.id}>
                        {x.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isAdmin && (
              <>
                <Button type="button" variant="outline" className="bg-card" onClick={() => setAdding(true)}>
                  <Plus className="size-4" aria-hidden /> Add
                </Button>
                <Button
                  type="button"
                  disabled={!dirty || errors.length > 0}
                  onClick={handleSaveAll}
                >
                  <Save className="size-4" aria-hidden /> Save
                </Button>
              </>
            )}
          </div>
        }
      />

      {!isAdmin && (
        <p role="note" className="flex items-center gap-2.5 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          Only super users (admins) can change worklist settings, columns and custom fields.
        </p>
      )}

      <Tabs defaultValue="worklist" className="gap-4">
        <TabsList variant="line" className="h-11 w-full justify-start gap-0 overflow-x-auto border-b p-0 sm:gap-2">
          <TabsTrigger value="worklist" className={tab}>
            <Columns3 aria-hidden /> Worklist Columns
          </TabsTrigger>
          <TabsTrigger value="fields" className={tab}>
            <Shapes aria-hidden /> Template Fields
          </TabsTrigger>
          <TabsTrigger value="software" className={tab}>
            <FileSpreadsheet aria-hidden /> Field Mapping
          </TabsTrigger>
        </TabsList>
        <TabsContent value="worklist">
          <WorklistColumnsTab isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="fields">
          <CustomFieldsTab isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="software">
          {activeSoftware && (
            <SoftwareTab
              software={activeSoftware}
              columns={currentColumns}
              worklistColumns={globalWorklistColumns}
              onChangeColumns={setDraftColumns}
              customFields={customFields}
              errors={errors}
              isAdmin={isAdmin}
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = newSwName.trim();
              if (!trimmed) return;
              const created = addSoftware(trimmed, copyFrom === "none" ? undefined : copyFrom);
              setSelectedId(created.id);
              void saveSoftwareToSupabase(created);
              setDraftColumns(null);
              setDraftWorklistCols(null);
              setSoftwareSwitched(true);
              setNewSwName("");
              setAdding(false);
              toast.success(`${created.name} added`);
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>Add billing software</DialogTitle>
              <DialogDescription>Start from an existing template and configure its columns.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="header-sw-name">Software name</Label>
              <Input id="header-sw-name" required autoFocus placeholder="e.g. NextGen" value={newSwName} onChange={(e) => setNewSwName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Start from</Label>
              <Select value={copyFrom} onValueChange={setCopyFrom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Empty template</SelectItem>
                  {softwares.map((x) => (
                    <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              <Button type="submit">Add software</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
