import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { Db } from "mongodb";
import { ItemRepository } from "../repositories/itemRepository.js";
import { normalizeTags, isItemStatus } from "../models/item.js";
import { clampString, isNonEmptyString, nowIso } from "../utils/http.js";

type ApiError = { error: string; details?: Record<string, unknown> };
type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

function asyncHandler(fn: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
}

function badRequest(res: Response, error: string, details?: Record<string, unknown>) {
  const payload: ApiError = { error, details };
  return res.status(400).json(payload);
}

function notFound(res: Response) {
  const payload: ApiError = { error: "nao encontrado" };
  return res.status(404).json(payload);
}

export function itemsRouter(db: Db): Router {
  const router = Router();
  const repo = new ItemRepository(db);

  repo.ensureIndexes().catch((e) => console.error("ensureIndexes failed", e));

  router.get("/items", asyncHandler(async (_req, res) => {
    const items = await repo.list(50);
    return res.json({ data: items });
  }));

  router.post("/items", asyncHandler(async (req, res) => {
    const titleRaw = req.body?.title as unknown;
    if (!isNonEmptyString(titleRaw)) return badRequest(res, "title obrigatorio");

    const title = clampString(String(titleRaw), 120);
    if (!title) return badRequest(res, "title obrigatorio");

    const tags = normalizeTags(req.body?.tags);

    const doc = await repo.create({ title, tags }, nowIso());
    return res.status(201).json({ data: doc });
  }));

  router.get("/items/:id", asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) return badRequest(res, "id invalido");

    try {
      const doc = await repo.getById(id);
      if (!doc) return notFound(res);
      return res.json({ data: doc });
    } catch {
      return badRequest(res, "id invalido");
    }
  }));

  router.patch("/items/:id", asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) return badRequest(res, "id invalido");

    const patch: Record<string, unknown> = {};

    if (req.body?.title !== undefined) {
      if (!isNonEmptyString(req.body.title)) return badRequest(res, "title invalido");
      const title = clampString(String(req.body.title), 120);
      if (!title) return badRequest(res, "title invalido");
      patch.title = title;
    }

    if (req.body?.status !== undefined) {
      if (!isItemStatus(req.body.status)) {
        return badRequest(res, "status invalido", { allowed: ["open", "done"] });
      }
      patch.status = req.body.status;
    }

    if (req.body?.tags !== undefined) {
      patch.tags = normalizeTags(req.body.tags);
    }

    try {
      const doc = await repo.patch(id, patch, nowIso());
      if (!doc) return notFound(res);
      return res.json({ data: doc });
    } catch {
      return badRequest(res, "id invalido");
    }
  }));

  router.delete("/items/:id", asyncHandler(async (req, res) => {
    const id = String(req.params.id ?? "").trim();
    if (!id) return badRequest(res, "id invalido");

    try {
      const ok = await repo.delete(id);
      if (!ok) return notFound(res);
      return res.status(204).send();
    } catch {
      return badRequest(res, "id invalido");
    }
  }));

  return router;
}
