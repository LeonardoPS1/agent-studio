// Cliente servidor hacia OpenFang. La clave nunca llega al navegador.
const BASE = (process.env.OPENFANG_URL ?? "http://localhost:4200").replace(/\/$/, "");
const KEY = process.env.OPENFANG_API_KEY ?? "";

export function of(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (KEY) headers.set("authorization", `Bearer ${KEY}`);
  return fetch(BASE + path, { ...init, headers, cache: "no-store" });
}

export async function ofJson<T = any>(path: string): Promise<T | null> {
  try {
    const r = await of(path, { signal: AbortSignal.timeout(6000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}
