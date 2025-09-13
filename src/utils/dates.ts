
export function getQueryParamList(url: URL, key: string): string[] | null {
  const val = url.searchParams.get(key);
  if (!val) return null;
  return val.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
}
