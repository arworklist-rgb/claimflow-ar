import { toast } from "sonner";

/** Copies text and says so. Falls back to a hidden textarea where the async clipboard API isn't available. */
export async function copyText(text: string, label = "Copied") {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    toast.success(label, { description: text });
  } catch {
    toast.error("Couldn't copy to the clipboard", { description: text });
  }
}

/** Accepts "example.com" or a full link; only http(s) links are allowed. Returns undefined when it isn't a valid web address. */
export function normalizeWebsite(input: string): string | undefined {
  const value = input.trim();
  if (!value) return undefined;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString().replace(/\/$/, "") : undefined;
  } catch {
    return undefined;
  }
}
