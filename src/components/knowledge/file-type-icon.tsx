import { File, FileSpreadsheet, FileText, type LucideIcon } from "lucide-react";
import { kindOf, type FileKind } from "@/lib/knowledge/files";
import { cn } from "@/lib/utils";

const STYLE: Record<FileKind | "other", { icon: LucideIcon; tile: string }> = {
  excel: { icon: FileSpreadsheet, tile: "bg-green-500/10 text-green-600 dark:text-green-400" },
  word: { icon: FileText, tile: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  pdf: { icon: FileText, tile: "bg-red-500/10 text-red-600 dark:text-red-400" },
  other: { icon: File, tile: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
};

export function FileTypeIcon({ ext, className }: { ext: string; className?: string }) {
  const { icon: Icon, tile } = STYLE[kindOf(ext) ?? "other"];
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", tile, className)} title={ext.toUpperCase()}>
      <Icon className="size-5" aria-hidden />
      <span className="sr-only">{ext.toUpperCase()} file</span>
    </span>
  );
}
