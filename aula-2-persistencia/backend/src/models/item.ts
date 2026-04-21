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

export function isItemStatus(x: unknown): x is ItemStatus {
  return x === "open" || x === "done";
}

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
