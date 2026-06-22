// Tiny client-side fetch helper. Throws on non-2xx with the server's message.
export async function api<T = any>(
  url: string,
  method: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.error ?? `Request failed (${res.status})`);
  return data as T;
}
