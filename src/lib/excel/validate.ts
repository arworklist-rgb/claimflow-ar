import { formatBytes } from "@/lib/format";

export interface FileRules {
  /** Lower-case extensions including the dot, e.g. [".xlsx", ".xls"]. */
  extensions: readonly string[];
  maxBytes: number;
}

export const CLAIM_FILE_RULES: FileRules = {
  extensions: [".xlsx", ".xls"],
  maxBytes: 25 * 1024 * 1024,
};

export const DENIAL_FILE_RULES: FileRules = {
  extensions: [".xlsx", ".xls", ".csv"],
  maxBytes: 5 * 1024 * 1024,
};

/** Returns a user-facing error message, or null when the file is acceptable. */
export function validateFile(file: File, rules: FileRules): string | null {
  const name = file.name.toLowerCase();
  if (!rules.extensions.some((ext) => name.endsWith(ext))) {
    return `Unsupported file type. Please upload ${rules.extensions.join(", ")}.`;
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > rules.maxBytes) {
    return `File is too large (${formatBytes(file.size)}). Maximum size is ${formatBytes(rules.maxBytes)}.`;
  }
  return null;
}
