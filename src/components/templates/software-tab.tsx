"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { downloadSoftwareTemplate } from "@/lib/excel/software-template";
import { useDemoStore } from "@/lib/store/demo-store";
import { REQUIRED_FIELD_KEYS, uidShort, validateSoftware } from "@/lib/templates";
import type { CustomField, Software, SoftwareColumn, Status } from "@/lib/types";
import { FieldSelect } from "./field-select";
import { TemplateHeaderSelect } from "./template-header-select";

export function SoftwareTab({ isAdmin }: { isAdmin: boolean }) {
  const softwares = useDemoStore((s) => s.softwares);
  const customFields = useDemoStore((s) => s.customFields);
  const addSoftware = useDemoStore((s) => s.addSoftware);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const selected = softwares.find((x) => x.id === selectedId) ?? softwares[0];

  return (
    <div className="space-y-5">
      {selected ? (
        <SoftwareEditor key={`${selected.id}:${selected.name}:${selected.status}:${JSON.stringify(selected.columns)}`} software={selected} customFields={customFields} isAdmin={isAdmin} onSelect={setSelectedId} onAdd={() => setAdding(true)} />
      ) : (
        <Card className="p-8 text-center text-sm text-muted-foreground">No billing software yet. Add one to set up its template.</Card>
      )}

      {isAdmin && (
        <AddSoftwareDialog
          open={adding}
          onOpenChange={setAdding}
          onAdd={(name, copyFrom) => {
            const created = addSoftware(name, copyFrom);
            setSelectedId(created.id);
            toast.success(`${created.name} added`);
          }}
        />
      )}
    </div>
  );
}

function AddSoftwareDialog({ open, onOpenChange, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; onAdd: (name: string, copyFrom?: string) => void }) {
  const softwares = useDemoStore((s) => s.softwares);
  const [name, setName] = useState("");
  const [copyFrom, setCopyFrom] = useState("sw-standard");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a software name.");
    if (softwares.some((x) => x.name.toLowerCase() === trimmed.toLowerCase())) return setError(`“${trimmed}” already exists.`);
    onAdd(trimmed, copyFrom === "none" ? undefined : copyFrom);
    setName("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader className="border-b p-5">
            <DialogTitle>Add billing software</DialogTitle>
            <DialogDescription>Start from an existing template and rename the columns to match this software.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="sw-name">Software name</Label>
              <Input id="sw-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. NextGen" aria-invalid={!!error} autoFocus />
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sw-copy">Start from</Label>
              <Select value={copyFrom} onValueChange={setCopyFrom}>
                <SelectTrigger id="sw-copy" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Empty template</SelectItem>
                  {softwares.map((x) => (
                    <SelectItem key={x.id} value={x.id}>
                      {x.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t p-5">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add software</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditorProps {
  software: Software;
  customFields: CustomField[];
  isAdmin: boolean;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

function SoftwareEditor({ software, customFields, isAdmin, onSelect, onAdd }: EditorProps) {
  const softwares = useDemoStore((s) => s.softwares);
  const updateSoftware = useDemoStore((s) => s.updateSoftware);

  const name = software.name;
  const [status, setStatus] = useState<Status>(software.status);
  const [columns, setColumns] = useState<SoftwareColumn[]>(software.columns);

  const errors = useMemo(() => validateSoftware({ name, columns }, customFields, softwares, software.id), [name, columns, customFields, softwares, software.id]);
  const dirty =
    status !== software.status || JSON.stringify(columns) !== JSON.stringify(software.columns);
  const readOnly = !isAdmin;

  const patch = (id: string, p: Partial<SoftwareColumn>) => setColumns((list) => list.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const move = (i: number, dir: -1 | 1) =>
    setColumns((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const save = () => {
    if (errors.length > 0) return;
    updateSoftware(software.id, {
      name,
      status,
      columns: columns.map((c) => ({
        ...c,
        header: c.header.trim(),
        aliases: c.aliases.map((a) => a.trim()).filter(Boolean),
        required: c.required || (REQUIRED_FIELD_KEYS as readonly string[]).includes(c.field),
      })),
    });
    toast.success(`${name.trim()} template saved`);
  };

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-wrap items-end gap-3 border-b p-5">
        <div className="space-y-1.5">
          <Label htmlFor="sw-switch">Billing software</Label>
          <div className="flex items-center gap-2">
            <Select value={software.id} onValueChange={onSelect}>
              <SelectTrigger id="sw-switch" className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {softwares.map((x) => (
                  <SelectItem key={x.id} value={x.id}>
                    {x.name}
                    {x.status === "Inactive" ? " (inactive)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button type="button" variant="outline" onClick={onAdd}>
                <Plus aria-hidden /> Add
              </Button>
            )}
          </div>
        </div>
        <div className="w-36 space-y-1.5">
          <Label htmlFor="sw-edit-status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as Status)} disabled={readOnly}>
            <SelectTrigger id="sw-edit-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await downloadSoftwareTemplate({ ...software, name, columns }, customFields);
            toast.success("Template downloaded");
          }}
          disabled={errors.length > 0}
        >
          <Download aria-hidden /> Download template
        </Button>
      </div>

      <div className="space-y-3 p-5">
        <div>
          <h3 className="text-sm font-bold">Template columns</h3>
          <p className="text-[13px] text-muted-foreground">
            The columns this software&apos;s Excel file has, in order, as the downloaded template writes them. Each one feeds a worklist field.
            Claim No, Patient and Service date are always required.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="bg-muted/50 text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="w-10 px-3 py-2 text-left font-semibold">#</th>
                <th className="w-52 px-2 py-2 text-left font-semibold">Worklist fields</th>
                {!readOnly && <th className="w-28 px-2 py-2 text-left font-semibold">Order</th>}
                <th className="px-2 py-2 text-left font-semibold">Template Fields</th>
                <th className="px-2 py-2 text-left font-semibold">Also accepts</th>
                <th className="w-20 px-2 py-2 text-center font-semibold">Required</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((c, i) => {
                const forced = (REQUIRED_FIELD_KEYS as readonly string[]).includes(c.field);
                return (
                  <tr key={c.id} className="border-t align-middle">
                    <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-2 py-2">
                      <FieldSelect aria-label={`Column ${i + 1} maps to`} value={c.field} onChange={(field) => patch(c.id, { field })} customFields={customFields} disabled={readOnly} className="h-9 w-full bg-card" />
                    </td>
                    {!readOnly && (
                      <td className="px-2 py-2">
                        <div className="flex justify-start gap-0.5">
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move column ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp />
                          </Button>
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move column ${i + 1} down`} disabled={i === columns.length - 1} onClick={() => move(i, 1)}>
                            <ArrowDown />
                          </Button>
                          <Switch
                            aria-label={`Column ${i + 1} ${c.hidden ? "hidden" : "shown"} in template`}
                            title={forced ? "Always shown: every claim needs it" : c.hidden ? "Hidden from the template. Turn on to show it" : "Shown in the template. Turn off to hide it"}
                            checked={!c.hidden}
                            disabled={forced}
                            onCheckedChange={(on) => patch(c.id, { hidden: !on })}
                            className="mx-1.5 self-center"
                          />
                        </div>
                      </td>
                    )}
                    <td className="px-2 py-2">
                      <TemplateHeaderSelect
                        aria-label={`Column ${i + 1} name`}
                        value={c.header}
                        onChange={(header) => patch(c.id, { header })}
                        customFields={customFields}
                        extraOptions={columns.map((col) => col.header)}
                        disabled={readOnly}
                        className="h-9 w-full bg-card"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        aria-label={`Column ${i + 1} other names`}
                        value={c.aliases.join(", ")}
                        onChange={(e) => patch(c.id, { aliases: e.target.value.split(",") })}
                        placeholder="e.g. Claim Number, Claim ID"
                        disabled={readOnly}
                        className="h-9 bg-card"
                      />
                    </td>
                    <td className="px-2 py-2 text-center">
                      <Checkbox
                        aria-label={`Column ${i + 1} required`}
                        checked={c.required || forced}
                        disabled={readOnly || forced}
                        onCheckedChange={(v) => patch(c.id, { required: v === true })}
                      />
                    </td>
                  </tr>
                );
              })}
              {columns.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    No columns yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={() => setColumns((list) => [...list, { id: uidShort("col"), header: "", aliases: [], field: "", required: false }])}>
            <Plus aria-hidden /> Add column
          </Button>
        )}

        {errors.length > 0 && (
          <ul role="alert" aria-label="Template problems" className="space-y-1 rounded-lg border border-amber-300/70 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            {errors.map((e) => (
              <li key={e} className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {e}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!readOnly && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t bg-muted/30 px-5 py-3.5">
          {dirty && <span className="mr-auto text-sm text-muted-foreground">Unsaved changes</span>}
          <Button
            variant="outline"
            disabled={!dirty}
            onClick={() => {
              setStatus(software.status);
              setColumns(software.columns);
            }}
          >
            Discard
          </Button>
          <Button onClick={save} disabled={!dirty || errors.length > 0}>
            Save template
          </Button>
        </div>
      )}
    </Card>
  );
}

