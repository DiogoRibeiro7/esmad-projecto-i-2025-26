import type { NextFunction, Request, Response } from "express";
import { makeReqId } from "../utils/http.js";

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
