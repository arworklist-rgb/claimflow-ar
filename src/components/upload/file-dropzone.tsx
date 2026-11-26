"use client";

import { useId, useRef, useState } from "react";
import { CircleAlert, CloudUpload, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";
import type { FileRules } from "@/lib/excel/validate";
import { cn } from "@/lib/utils";

const TONES = {
  blue: {
    zone: "border-blue-300 bg-brand-soft/40 hover:border-blue-400 hover:bg-brand-soft/60 data-[dragging=true]:border-blue-500 data-[dragging=true]:bg-brand-soft dark:border-blue-400/30 dark:hover:border-blue-400/50",
    icon: "text-primary",
    button: "border-primary/60 text-primary hover:bg-brand-soft hover:text-primary dark:border-primary/60 dark:text-blue-300",
    link: "text-primary",
  },
  green: {
    zone: "border-green-300 bg-success-soft/50 hover:border-green-400 hover:bg-success-soft/70 data-[dragging=true]:border-green-500 data-[dragging=true]:bg-success-soft dark:border-green-500/30 dark:hover:border-green-500/50",
    icon: "text-success",
    button: "border-success/60 text-success hover:bg-success-soft hover:text-success dark:border-success/60 dark:text-green-400",
    link: "text-success",
  },
} as const;

interface FileDropzoneProps {
  rules: FileRules;
  /** Called with the chosen file (single-file mode). */
  onFile?: (file: File) => void;
  /** With `multiple`, called with every chosen file instead. */
  onFiles?: (files: File[]) => void;
  multiple?: boolean;
  /** Replaces the default "Supported format: Excel ..." hint. */
  hint?: string;
  tone?: keyof typeof TONES;
  /** "compact" is the small click-to-browse variant used in page headers. */
  size?: "default" | "compact";
  busy?: boolean;
  disabled?: boolean;
  /** Validation / parse error to show inline under the zone. */
  error?: string | null;
  title?: string;
  /** Rendered under the hint line, e.g. a "Try with a sample file" link. */
  footer?: React.ReactNode;
  className?: string;
}

export function FileDropzone({
  rules,
  onFile,
  onFiles,
  multiple = false,
  hint: hintOverride,
  tone = "blue",
  size = "default",
  busy = false,
  disabled = false,
  error,
  title = "Drag and drop Excel file here",
  footer,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();
  const [dragging, setDragging] = useState(false);
  const t = TONES[tone];
  const compact = size === "compact";
  const inactive = disabled || busy;

  const accept = rules.extensions.join(",");
  const browse = () => inputRef.current?.click();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (multiple && onFiles) onFiles(Array.from(files));
    else onFile?.(files[0]);
  };

  const hint = hintOverride ?? (compact
    ? `Supported files: ${rules.extensions.join(", ")} (Max ${formatBytes(rules.maxBytes)})`
    : `Supported format: Excel (${rules.extensions.join(", ")})  |  Max file size: ${formatBytes(rules.maxBytes)}`);

  return (
    <div className={className}>
      <div
        data-dragging={dragging}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!inactive) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!inactive) setDragging(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!inactive) handleFiles(e.dataTransfer.files);
        }}
        {...(compact && {
          role: "button",
          tabIndex: inactive ? -1 : 0,
          onClick: () => !inactive && browse(),
          onKeyDown: (e: React.KeyboardEvent) => {
            if (!inactive && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              browse();
            }
          },
          "aria-label": `${title}. ${hint}`,
        })}
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors",
          t.zone,
          compact ? "cursor-pointer gap-1.5 px-4 py-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50" : "gap-2 px-4 py-9 sm:py-11",
          inactive && "cursor-not-allowed opacity-60",
          error && "border-destructive/60",
        )}
      >
        {busy ? (
          <Loader2 className={cn("animate-spin", t.icon, compact ? "size-6" : "size-10")} aria-hidden />
        ) : compact ? (
          <Upload className={cn("size-5", t.icon)} aria-hidden />
        ) : (
          <span className="mb-1 grid size-14 place-items-center rounded-full bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <CloudUpload className={cn("size-7", t.icon)} strokeWidth={1.75} aria-hidden />
          </span>
        )}

        {compact ? (
          <p className="text-sm text-foreground">
            {busy ? (
              "Reading file…"
            ) : (
              <>
                Drag &amp; drop file here, or <span className={cn("font-semibold", t.link)}>click to browse</span>
              </>
            )}
          </p>
        ) : (
          <>
            <p className="text-base font-semibold text-foreground">{busy ? "Reading file…" : title}</p>
            <p className="text-sm text-muted-foreground">or</p>
            <Button type="button" variant="outline" className={cn("bg-card", t.button)} disabled={inactive} onClick={browse}>
              <Upload aria-hidden /> Choose File
            </Button>
          </>
        )}

        <p className="mt-1 text-xs text-muted-foreground/90">{hint}</p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          disabled={inactive}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ""; // allow re-picking the same file
          }}
        />
      </div>

      {error && (
        <p id={errorId} role="alert" className="mt-2 flex items-start gap-1.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}
      {footer}
    </div>
  );
}
