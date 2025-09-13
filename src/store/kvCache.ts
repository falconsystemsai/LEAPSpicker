
export async function cachedGetJSON(
  kv: KVNamespace,
  key: string,
  ttlSeconds: number,
  loader: () => Promise<any>,
) {
  const cached = await kv.get(key, { type: 'json' });
  if (cached) return cached;
  const data = await loader();
  await kv.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds });
  return data;
}

export async function putJSON(kv: KVNamespace, key: string, data: unknown, ttlSeconds?: number) {
  await kv.put(key, JSON.stringify(data), ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
}

export async function getJSON<T = any>(kv: KVNamespace, key: string): Promise<T | null> {
  const val = await kv.get(key, { type: 'json' });
  return (val as T) ?? null;
}
