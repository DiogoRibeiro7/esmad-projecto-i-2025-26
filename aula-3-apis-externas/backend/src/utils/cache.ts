/**
 * Cache em memória (TTL) para respostas rápidas sem nova chamada externa.
 *
 * Nota pedagógica:
 * - existe apenas enquanto o processo Node está ativo;
 * - reiniciar o backend limpa todo o cache.
 */
type CacheEntry<T> = { value: T; expiresAt: number };

const cache = new Map<string, CacheEntry<any>>();

/**
 * Lê um valor de cache por chave.
 *
 * Comportamento:
 * - se a chave não existir, devolve `null`;
 * - se estiver expirada, remove a entrada e devolve `null`;
 * - se estiver válida, devolve o valor tipado.
 *
 * @param key Chave única da entrada.
 * @returns Valor de cache ou `null`.
 */
export function getCache<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    cache.delete(key);
    return null;
  }
  return e.value as T;
}

/**
 * Escreve um valor em cache com prazo de expiração.
 *
 * @param key Chave única da entrada.
 * @param value Valor a guardar.
 * @param ttlMs Tempo de vida em milissegundos.
 * @returns Nada (`void`).
 */
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
