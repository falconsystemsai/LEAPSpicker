
export function renderJSON(data: any) {
  return JSON.stringify(data ?? { ts: null, results: [] }, null, 2);
}
