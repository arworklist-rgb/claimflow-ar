"use client";

import { Columns3, FileSpreadsheet, Lock, Shapes } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/use-auth";
import { useDemoStore } from "@/lib/store/demo-store";
import { CustomFieldsTab } from "./custom-fields-tab";
import { SoftwareTab } from "./software-tab";
import { WorklistColumnsTab } from "./worklist-columns-tab";

/** Settings > Upload Templates. Super users (admins) edit it; everyone else can look. */
export function TemplatesView() {
  const { can } = useAuth();
  const isAdmin = can("templates.manage");
  // The editor copies the saved columns into local state, so remount it when the saved ones change (e.g. after the store loads).
  const savedColumnsKey = useDemoStore((s) => JSON.stringify(s.worklistColumns));
  const tab = "px-3 text-sm font-semibold sm:px-4 sm:text-[15px] data-active:text-primary h-full flex-none gap-2";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Templates"
        description="Each billing software exports its own Excel layout. Set up its columns and names here, choose what the worklist shows, and add fields of your own."
      />

      {!isAdmin && (
        <p role="note" className="flex items-center gap-2.5 rounded-lg border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          Only super users (admins) can change templates, worklist columns and custom fields.
        </p>
      )}

      <Tabs defaultValue="software" className="gap-4">
        <TabsList variant="line" className="h-11 w-full justify-start gap-0 overflow-x-auto border-b p-0 sm:gap-2">
          <TabsTrigger value="software" className={tab}>
            <FileSpreadsheet aria-hidden /> Field Mapping
          </TabsTrigger>
          <TabsTrigger value="worklist" className={tab}>
            <Columns3 aria-hidden /> Worklist columns
          </TabsTrigger>
          <TabsTrigger value="fields" className={tab}>
            <Shapes aria-hidden /> Template fields
          </TabsTrigger>
        </TabsList>
        <TabsContent value="software">
          <SoftwareTab isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="worklist">
          <WorklistColumnsTab key={savedColumnsKey} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="fields">
          <CustomFieldsTab isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
