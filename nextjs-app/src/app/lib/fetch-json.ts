export type FetchJsonOptions = {
  init?: RequestInit;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

export async function fetchJson<T>(url: string, opts: FetchJsonOptions = {}): Promise<T> {
  const { init, timeoutMs = 8000, retries = 2, retryDelayMs = 400 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: ac.signal, cache: 'no-store' });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, retryDelayMs * (attempt + 1)));
        continue;
      }
    }
  }
  console.warn('[fetchJson] gagal:', url, String(lastErr));
  throw lastErr;
}
