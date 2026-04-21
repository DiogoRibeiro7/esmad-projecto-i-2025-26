import type { Request, Response } from "express";
import { Router } from "express";
import { fetchQuizQuestion, type Difficulty } from "../providers/quizProvider.js";

export const extQuizRouter = Router();

function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

function isDifficulty(x: string): x is Difficulty {
  return x === "easy" || x === "medium" || x === "hard";
}

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
