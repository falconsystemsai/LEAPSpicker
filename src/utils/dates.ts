
export function getQueryParamList(url: URL, key: string): string[] | null {
  const val = url.searchParams.get(key);
  if (!val) return null;
  return val.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
}

export function formatNY(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
