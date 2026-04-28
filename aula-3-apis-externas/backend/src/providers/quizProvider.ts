/**
 * Tipos e provider para integração com API externa de perguntas de quiz.
 *
 * Objetivo do provider:
 * - isolar detalhes do fornecedor externo;
 * - converter o formato original para o formato interno da aplicação.
 */
export type Difficulty = "easy" | "medium" | "hard";

export interface QuizQuestion {
  question: string;
  answers: string[];
  correctAnswer?: string;
}

export interface QuizFetchResult {
  data: QuizQuestion;
  provider: "quiz";
}

/**
 * Obtém uma pergunta de quiz a partir de API externa e normaliza a resposta.
 *
 * @param params.category Categoria pedida pelo cliente (ex.: "general").
 * @param params.difficulty Dificuldade pedida (`easy` | `medium` | `hard`).
 * @param params.apiKey Chave opcional para APIs que exijam autenticação.
 * @param params.timeoutMs Timeout da chamada externa em milissegundos (default: 3500).
 * @throws Error com `code=429` em rate limit.
 * @throws Error com `code=502` quando upstream falha ou devolve formato inválido.
 * @returns Objeto normalizado `{ provider, data }` para o router devolver ao frontend.
 */
export async function fetchQuizQuestion(params: {
  category: string;
  difficulty: Difficulty;
  apiKey?: string;
  timeoutMs?: number;
}): Promise<QuizFetchResult> {
  const { category, difficulty, apiKey, timeoutMs = 3500 } = params;

  const QUIZ_EXTERNAL_URL = "https://the-trivia-api.com/api/questions";

  const url =
    `${QUIZ_EXTERNAL_URL}?` +
    `categories=${encodeURIComponent(category)}` +
    `&difficulty=${encodeURIComponent(difficulty)}` +
    `&limit=1`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { "Accept": "application/json" };
    if (apiKey && apiKey.trim().length > 0) {
      headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    }

    const r = await fetch(url, { headers, signal: controller.signal });

    if (r.status === 429) {
      const err = new Error("RATE_LIMIT");
      (err as any).code = 429;
      throw err;
    }
    if (!r.ok) {
      const err = new Error("UPSTREAM_ERROR");
      (err as any).code = 502;
      throw err;
    }

    const raw = await r.json();
    const item = Array.isArray(raw) ? raw[0] : raw;

    const question = String(item?.question ?? "").trim();
    const correctAnswer = typeof item?.correctAnswer === "string" ? item.correctAnswer : undefined;
    const incorrectAnswers = Array.isArray(item?.incorrectAnswers)
      ? item.incorrectAnswers.map(String).filter(Boolean)
      : [];
    const answers = [correctAnswer, ...incorrectAnswers].filter(Boolean);

    if (!question || answers.length === 0) {
      const err = new Error("BAD_UPSTREAM_SHAPE");
      (err as any).code = 502;
      throw err;
    }

    return {
      provider: "quiz",
      data: { question, answers, correctAnswer }
    };
  } finally {
    clearTimeout(timer);
  }
}
