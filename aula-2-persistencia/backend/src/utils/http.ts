/**
 * Helpers genéricos usados em múltiplos módulos do backend.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Gera id curto para rastreamento de requests em logs.
 *
 * @returns String pseudo-única.
 */
export function makeReqId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Type guard para string não vazia.
 *
 * @param x Valor a validar.
 * @returns `true` se for string com conteúdo.
 */
export function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

/**
 * Aplica trim e limite máximo de caracteres.
 *
 * @param x Texto original.
 * @param maxLen Tamanho máximo permitido.
 * @returns Texto normalizado.
 */
export function clampString(x: string, maxLen: number): string {
  const t = x.trim();
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}
