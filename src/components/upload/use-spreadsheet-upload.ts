import { useCallback, useRef, useState } from "react";
import { parseSpreadsheet, SpreadsheetError, type ParsedSheet } from "@/lib/excel/parse";
import { validateFile, type FileRules } from "@/lib/excel/validate";

/**
 * The shared "pick a file -> validate -> parse -> preview" pipeline used by every
 * upload area (new claims, paid claims, denial reasons - both dropzones).
 */
export function useSpreadsheetUpload(
  rules: FileRules,
  expected: readonly string[],
  optional: readonly string[] = [],
  headerlessColumns?: readonly string[],
  aliases?: Record<string, string[]>,
) {
  const [result, setResult] = useState<{ file: File; parsed: ParsedSheet } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  // Ignore results from a previous pick if the user selects another file quickly.
  const latest = useRef(0);

  const selectFile = useCallback(
    async (file: File) => {
      const ticket = ++latest.current;
      setError(null);

      const invalid = validateFile(file, rules);
      if (invalid) {
        setResult(null);
        setError(invalid);
        return;
      }

      setParsing(true);
      try {
        const parsed = await parseSpreadsheet(file, expected, optional, headerlessColumns, aliases);
        if (ticket !== latest.current) return;
        setResult({ file, parsed });
      } catch (err) {
        if (ticket !== latest.current) return;
        setResult(null);
        setError(err instanceof SpreadsheetError ? err.message : "Something went wrong reading this file.");
      } finally {
        if (ticket === latest.current) setParsing(false);
      }
    },
    [rules, expected, optional, headerlessColumns, aliases],
  );

  const clear = useCallback(() => {
    latest.current++;
    setResult(null);
    setError(null);
    setParsing(false);
  }, []);

  return {
    file: result?.file ?? null,
    parsed: result?.parsed ?? null,
    error,
    setError,
    parsing,
    selectFile,
    clear,
  };
}
