const USER_AGENT = 'Mozilla/5.0 (educ_mentor POC flashcards scraper, usage familial)';
const RETRY_DELAYS_MS = [500, 1500, 4000];

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function withRetry<T>(label: string, attempt: () => Promise<T>): Promise<T> {
  for (let tryIndex = 0; tryIndex <= RETRY_DELAYS_MS.length; tryIndex++) {
    try {
      return await attempt();
    } catch (error) {
      if (tryIndex === RETRY_DELAYS_MS.length) throw error;
      const delay = RETRY_DELAYS_MS[tryIndex];
      console.warn(`  retry ${label} in ${delay}ms (${(error as Error).message})`);
      await wait(delay);
    }
  }
  throw new Error('unreachable');
}

export function fetchText(url: string): Promise<string> {
  return withRetry(url, async () => {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.text();
  });
}

export interface FetchBinaryResult {
  ok: boolean;
  status: number;
  contentType: string | null;
  bytes: Buffer | null;
}

/** Ne relance pas sur un 404 (fréquent et attendu pour les cartes-titre). */
export async function fetchBinary(url: string): Promise<FetchBinaryResult> {
  return withRetry(url, async () => {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const contentType = response.headers.get('content-type');
    if (response.status === 404) {
      return { ok: false, status: 404, contentType, bytes: null };
    }
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    const arrayBuffer = await response.arrayBuffer();
    return { ok: true, status: response.status, contentType, bytes: Buffer.from(arrayBuffer) };
  });
}

/** Exécute `worker` sur chaque item, `concurrency` en parallèle, avec une pause entre deux départs. */
export async function pooled<TItem, TResult>(
  items: TItem[],
  concurrency: number,
  spacingMs: number,
  worker: (item: TItem, index: number) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length);
  let nextIndex = 0;

  async function runLane(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      if (spacingMs > 0) await wait(spacingMs);
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, runLane));
  return results;
}
