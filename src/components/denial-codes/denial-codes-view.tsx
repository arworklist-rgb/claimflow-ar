"use client";

import { useState } from "react";
import { CircleCheck, CloudUpload, Download, List, Lock, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { useSpreadsheetUpload } from "@/components/upload/use-spreadsheet-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DENIAL_CODE_COLUMNS, DENIAL_CODE_OPTIONAL_COLUMNS } from "@/lib/excel/columns";
import { downloadDenialCodeTemplate } from "@/lib/excel/denial-template";
import { DENIAL_FILE_RULES } from "@/lib/excel/validate";
import { useDemoStore } from "@/lib/store/demo-store";
import { useIsAdmin } from "@/lib/store/selectors";
import type { DenialCode } from "@/lib/types";
import { DenialCodeDialog } from "./denial-code-dialog";
import { DenialCodesTable } from "./denial-codes-table";
import { DenialUploadPanel } from "./denial-upload-panel";

export function DenialCodesView() {
  const codes = useDemoStore((s) => s.denialCodes);
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState("manage");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DenialCode | null>(null);

  // One upload pipeline feeds both the compact header dropzone and the Upload tab. The client's file has no
  // header row, so the first two columns are read as code and description when no header is found.
  const upload = useSpreadsheetUpload(DENIAL_FILE_RULES, DENIAL_CODE_COLUMNS, DENIAL_CODE_OPTIONAL_COLUMNS, DENIAL_CODE_COLUMNS);

  const handleHeaderFile = async (file: File) => {
    setTab("upload");
    await upload.selectFile(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Denial Codes"
        description="The standard denial codes your team picks from on worklist claims. Each code has a description and a category."
        actions={
          isAdmin ? (
            <Button size="lg" onClick={() => setAdding(true)}>
              <Plus aria-hidden /> Add Denial Code
            </Button>
          ) : undefined
        }
      />

      {!isAdmin && (
        <p
          role="note"
          className="flex items-center gap-2.5 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"
        >
          <Lock className="size-4 shrink-0" aria-hidden />
          Only admins can manage denial codes.
        </p>
      )}

      <div className={isAdmin ? "grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]" : "grid gap-4 sm:grid-cols-2 lg:max-w-2xl"}>
        <div className={isAdmin ? "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-1" : "contents"}>
          <StatCard label="Total Denial Codes" value={codes.length} icon={Tag} />
          <StatCard label="Active" value={codes.filter((r) => r.status === "Active").length} icon={CircleCheck} tone="green" />
        </div>
        {isAdmin && (
          <Card className="gap-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <CloudUpload className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-[15px] leading-tight font-bold">Upload Denial Codes</h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">Import codes from an Excel or CSV file: code, then description.</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="bg-card text-primary dark:text-blue-300"
                onClick={async () => {
                  await downloadDenialCodeTemplate();
                  toast.success("Template downloaded");
                }}
              >
                <Download aria-hidden /> Download Template
              </Button>
            </div>
            <FileDropzone
              size="compact"
              rules={DENIAL_FILE_RULES}
              onFile={handleHeaderFile}
              busy={upload.parsing}
              error={upload.error}
              title="Upload denial codes file"
            />
          </Card>
        )}
      </div>

      <Tabs value={isAdmin ? tab : "manage"} onValueChange={setTab} className="gap-4">
        {isAdmin && (
          <TabsList variant="line" className="h-11 w-full justify-start gap-0 border-b p-0 sm:gap-2">
            <TabsTrigger value="manage" className="h-full flex-none gap-2 px-3 text-sm font-semibold sm:px-4 sm:text-[15px] data-active:text-primary">
              <List aria-hidden />
              <span className="sm:hidden">Manage</span>
              <span className="hidden sm:inline">Manage Denial Codes</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="h-full flex-none gap-2 px-3 text-sm font-semibold sm:px-4 sm:text-[15px] data-active:text-primary">
              <CloudUpload aria-hidden />
              <span className="sm:hidden">Upload</span>
              <span className="hidden sm:inline">Upload Denial Codes</span>
            </TabsTrigger>
          </TabsList>
        )}
        <TabsContent value="manage">
          <DenialCodesTable isAdmin={isAdmin} editing={editing} onEditingChange={setEditing} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="upload">
            <DenialUploadPanel upload={upload} onImported={() => setTab("manage")} />
          </TabsContent>
        )}
      </Tabs>

      {isAdmin && <DenialCodeDialog open={adding} onOpenChange={setAdding} />}
    </div>
  );
}
