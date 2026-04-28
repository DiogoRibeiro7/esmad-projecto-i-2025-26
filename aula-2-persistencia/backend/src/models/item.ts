/**
 * Tipos e regras de domínio do recurso `Item`.
 *
 * Este ficheiro concentra:
 * - tipos TypeScript usados em várias camadas;
 * - validações/sanitizações de dados de entrada.
 */
import type { ObjectId } from "mongodb";

export type ItemStatus = "open" | "done";

export interface ItemDoc {
  _id: ObjectId;
  title: string;
  status: ItemStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ItemCreateInput {
  title: string;
  tags: string[];
}

export interface ItemPatchInput {
  title?: string;
  status?: ItemStatus;
  tags?: string[];
}

/**
 * Type guard para validar o estado de um item.
 *
 * @param x Valor a validar.
 * @returns `true` apenas para `"open"` ou `"done"`.
 */
export function isItemStatus(x: unknown): x is ItemStatus {
  return x === "open" || x === "done";
}

/**
 * Normaliza e limita a lista de tags recebida do cliente.
 *
 * Regras:
 * - ignora input que não seja array;
 * - mantém apenas strings;
 * - remove espaços extra;
 * - remove vazios;
 * - ignora tags com mais de 24 caracteres;
 * - remove duplicados;
 * - limita a 10 tags.
 *
 * @param x Input bruto vindo do request.
 * @returns Array de tags já limpas.
 */
export function normalizeTags(x: unknown): string[] {
  if (!Array.isArray(x)) return [];

  const out: string[] = [];
  for (const v of x) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t) continue;
    if (t.length > 24) continue;
    out.push(t);
  }

  return Array.from(new Set(out)).slice(0, 10);
}
