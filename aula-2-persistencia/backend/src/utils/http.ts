export function nowIso(): string {
  return new Date().toISOString();
}

export function makeReqId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

export function clampString(x: string, maxLen: number): string {
  const t = x.trim();
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}
