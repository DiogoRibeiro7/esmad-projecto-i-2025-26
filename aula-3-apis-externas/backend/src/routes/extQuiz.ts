import type { Request, Response } from "express";
import { Router } from "express";
import { fetchQuizQuestion, type Difficulty } from "../providers/quizProvider.js";

/**
 * Router dedicado à integração externa de quiz.
 * É montado no servidor sob o prefixo `/api`.
 */
export const extQuizRouter = Router();

/**
 * Type guard para validar strings não vazias.
 *
 * @param x Valor desconhecido vindo de input externo.
 * @returns `true` se `x` for string e tiver conteúdo após `trim()`.
 */
function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

/**
 * Type guard para validar os níveis de dificuldade suportados.
 *
 * @param x Valor textual da dificuldade.
 * @returns `true` apenas para `easy`, `medium` ou `hard`.
 */
function isDifficulty(x: string): x is Difficulty {
  return x === "easy" || x === "medium" || x === "hard";
}

/**
 * GET /ext/quiz/question
 *
 * Fluxo:
 * 1) valida `category` e `difficulty`;
 * 2) chama o provider externo;
 * 3) devolve resposta normalizada (`data` + `meta`);
 * 4) traduz erros técnicos em HTTP errors compreensíveis para o cliente.
 *
 * @param req Request Express com query string.
 * @param res Response Express com JSON normalizado.
 * @returns Response HTTP com pergunta ou mensagem de erro.
 */
extQuizRouter.get("/ext/quiz/question", async (req: Request, res: Response) => {
  const t0 = Date.now();
  const category = String(req.query.category ?? "").trim();
  const difficultyRaw = String(req.query.difficulty ?? "").trim();

  if (!isNonEmptyString(category) || !isNonEmptyString(difficultyRaw) || !isDifficulty(difficultyRaw)) {
    return res.status(400).json({ error: "category e difficulty (easy|medium|hard) sao obrigatorios" });
  }

  try {
    const apiKey = process.env.QUIZ_API_KEY;

    const out = await fetchQuizQuestion({
      category,
      difficulty: difficultyRaw,
      apiKey,
      timeoutMs: 3500
    });

    const latencyMs = Date.now() - t0;

    console.log(JSON.stringify({
      endpoint: "/api/ext/quiz/question",
      status: 200,
      latency_ms: latencyMs,
      category,
      difficulty: difficultyRaw
    }));

    return res.json({
      data: out.data,
      meta: { provider: out.provider, cached: false }
    });
  } catch (err) {
    const code = typeof (err as any)?.code === "number" ? (err as any).code : 504;
    const latencyMs = Date.now() - t0;

    console.log(JSON.stringify({
      endpoint: "/api/ext/quiz/question",
      status: code,
      latency_ms: latencyMs,
      error: String(err)
    }));

    if (code === 429) return res.status(429).json({ error: "limite atingido, tenta novamente" });
    if (code === 502) return res.status(502).json({ error: "falha na API externa" });
    return res.status(504).json({ error: "timeout/erro a contactar API externa" });
  }
});
