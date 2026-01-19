export function toAbsoluteAssetUrl(input?: string): string {
  if (!input) return "";

  const normalized = (() => {
    const s = String(input);
    const lower = s.toLowerCase();

    if (lower.startsWith("file:")) {
      const withoutScheme = s.replace(/^file:\/\//i, "");
      const asPath = withoutScheme.replace(/^\/+/, "");
      const idx = asPath.toLowerCase().indexOf("/uploads/");
      if (idx >= 0) return `/uploads/${asPath.slice(idx + "/uploads/".length)}`;
      const idxBack = asPath.toLowerCase().indexOf("\\uploads\\");
      if (idxBack >= 0) {
        const rest = asPath.slice(idxBack + "\\uploads\\".length).replace(/\\/g, "/");
        return `/uploads/${rest}`;
      }
      return null;
    }

    if (/^[a-zA-Z]:[\\/]/.test(s)) {
      const idx = lower.indexOf("\\uploads\\");
      if (idx >= 0) {
        const rest = s.slice(idx + "\\uploads\\".length).replace(/\\/g, "/");
        return `/uploads/${rest}`;
      }
      const idx2 = lower.indexOf("/uploads/");
      if (idx2 >= 0) return `/uploads/${s.slice(idx2 + "/uploads/".length)}`;
    }

    return null;
  })();

  if (normalized) input = normalized;

  if (/^(https?:|data:|file:)/i.test(input)) return input;
  const isFile = typeof window !== "undefined" && window.location.protocol === "file:";
  if (isFile) {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:5000";
    try {
      return new URL(input, base).toString();
    } catch {
      return `${base}${input}`;
    }
  }
  return input;
}
