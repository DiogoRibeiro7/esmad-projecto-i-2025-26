import type { NextFunction, Request, Response } from "express";
import { makeReqId } from "../utils/http.js";

/**
 * Middleware que adiciona metadados de observabilidade a cada request.
 *
 * O que faz:
 * - gera `reqId` único;
 * - expõe esse valor no header `x-request-id`;
 * - mede latência total e escreve log no fim da resposta.
 *
 * @param req Objeto de request Express.
 * @param res Objeto de response Express.
 * @param next Função para avançar para o próximo middleware.
 * @returns Nada (`void`).
 */
export function requestMeta(req: Request, res: Response, next: NextFunction): void {
  const reqId = makeReqId();
  const t0 = Date.now();

  res.locals.reqId = reqId;
  res.setHeader("x-request-id", reqId);

  res.on("finish", () => {
    const latencyMs = Date.now() - t0;
    console.log(JSON.stringify({
      reqId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      latency_ms: latencyMs
    }));
  });

  next();
}
