import { FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

interface FileChipProps {
  file: File;
  rows: number;
  tone?: "blue" | "green";
  onRemove: () => void;
  disabled?: boolean;
}

export function FileChip({ file, rows, tone = "blue", onRemove, disabled }: FileChipProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          tone === "green" ? "bg-success-soft text-success" : "bg-brand-soft text-brand-soft-foreground",
        )}
      >
        <FileSpreadsheet className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatBytes(file.size)} · {rows.toLocaleString("en-US")} {pluralize(rows, "row")}
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={onRemove} disabled={disabled}>
        <X />
      </Button>
    </div>
  );
}
