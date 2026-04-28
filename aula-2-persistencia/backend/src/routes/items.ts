import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import type { Db } from "mongodb";
import { ItemRepository } from "../repositories/itemRepository.js";
import { normalizeTags, isItemStatus } from "../models/item.js";
import { clampString, isNonEmptyString, nowIso } from "../utils/http.js";

/**
 * Rotas HTTP para CRUD de itens.
 *
 * Este módulo converte pedidos HTTP em operações de domínio/repositório.
 */
type ApiError = { error: string; details?: Record<string, unknown> };
type AsyncRoute = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Wrapper para handlers assíncronos em Express.
 *
 * @param fn Handler async.
 * @returns Middleware que faz `catch(next)` automaticamente.
 */
function asyncHandler(fn: AsyncRoute) {
  return (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };
}

/**
 * Resposta padrão para erro de validação/input.
 *
 * @param res Response Express.
 * @param error Mensagem de erro.
 * @param details Metadados opcionais.
 * @returns Response HTTP 400.
 */
function badRequest(res: Response, error: string, details?: Record<string, unknown>) {
  const payload: ApiError = { error, details };
  return res.status(400).json(payload);
}

/**
 * Resposta padrão quando recurso não existe.
 *
 * @param res Response Express.
 * @returns Response HTTP 404.
 */
function notFound(res: Response) {
  const payload: ApiError = { error: "nao encontrado" };
  return res.status(404).json(payload);
}

/**
 * Constrói router de itens com todas as rotas REST.
 *
 * @param db Ligação MongoDB.
 * @returns Router Express configurado.
 */
export function itemsRouter(db: Db): Router {
  const router = Router();
  const repo = new ItemRepository(db);

  repo.ensureIndexes().catch((e) => console.error("ensureIndexes failed", e));

  /**
   * GET /items
   * Lista até 50 itens.
   */
  router.get("/items", asyncHandler(async (_req, res) => {
    const items = await repo.list(50);
    return res.json({ data: items });
  }));

  /**
   * POST /items
   * Cria item novo após validação de `title` e normalização de `tags`.
   */
  router.post("/items", asyncHandler(async (req, res) => {
    const titleRaw = req.body?.title as unknown;
    if (!isNonEmptyString(titleRaw)) return badRequest(res, "title obrigatorio");

    const title = clampString(String(titleRaw), 120);
    if (!title) return badRequest(res, "title obrigatorio");

    const tags = normalizeTags(req.body?.tags);

    const doc = await repo.create({ title, tags }, nowIso());
    return res.status(201).json({ data: doc });
  }));

  /**
   * GET /items/:id
   * Obtém item por id.
   */
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

  /**
   * PATCH /items/:id
   * Atualiza parcialmente `title`, `status` e/ou `tags`.
   */
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

  /**
   * DELETE /items/:id
   * Remove item por id.
   */
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
