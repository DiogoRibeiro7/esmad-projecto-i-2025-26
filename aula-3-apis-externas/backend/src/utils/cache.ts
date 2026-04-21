type CacheEntry<T> = { value: T; expiresAt: number };

const cache = new Map<string, CacheEntry<any>>();

export function getCache<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    cache.delete(key);
    return null;
  }
  return e.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

// Uso tipico no route:
//
//   const cacheKey = `quiz:${category}:${difficulty}`;
//   const cached = getCache<QuizQuestion>(cacheKey);
//   if (cached) {
//     return res.json({ data: cached, meta: { provider: "quiz", cached: true } });
//   }
//   // ... chamar provider ...
//   setCache(cacheKey, out.data, 60_000);
