import { formatBytes } from "@/lib/format";
import type { FileRules } from "@/lib/excel/validate";

export const KNOWLEDGE_MAX_BYTES = 10 * 1024 * 1024;

export const KNOWLEDGE_FILE_RULES: FileRules = {
  extensions: [".doc", ".docx", ".xls", ".xlsx", ".csv", ".pdf"],
  maxBytes: KNOWLEDGE_MAX_BYTES,
};

export type FileKind = "excel" | "word" | "pdf";

const KIND_BY_EXT: Record<string, FileKind> = {
  xls: "excel",
  xlsx: "excel",
  csv: "excel",
  doc: "word",
  docx: "word",
  pdf: "pdf",
};

const MIME_BY_EXT: Record<string, string> = {
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pdf: "application/pdf",
};

export const extOf = (fileName: string) => (fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "");
export const kindOf = (ext: string): FileKind | undefined => KIND_BY_EXT[ext];
export const mimeOf = (ext: string) => MIME_BY_EXT[ext] ?? "application/octet-stream";
export const titleFromFileName = (fileName: string) => fileName.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();

/** User-facing reason a file can't be added, or null when it's fine. */
export function validateKnowledgeFile(file: File): string | null {
  const ext = extOf(file.name);
  if (!KNOWLEDGE_FILE_RULES.extensions.includes(`.${ext}`)) return "Unsupported type. Use Word, Excel, CSV or PDF.";
  if (file.size === 0) return "The file is empty.";
  if (file.size > KNOWLEDGE_MAX_BYTES) return `Too large (${formatBytes(file.size)}). The limit is ${formatBytes(KNOWLEDGE_MAX_BYTES)}.`;
  return null;
}

/** Triggers a browser download for a stored file. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
