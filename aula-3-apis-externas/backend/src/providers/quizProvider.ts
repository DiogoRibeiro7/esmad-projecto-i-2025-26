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

export async function fetchQuizQuestion(params: {
  category: string;
  difficulty: Difficulty;
  apiKey?: string;
  timeoutMs?: number;
}): Promise<QuizFetchResult> {
  const { category, difficulty, apiKey, timeoutMs = 3500 } = params;

  // TODO: substituir por URL real do fornecedor escolhido
  const QUIZ_EXTERNAL_URL = "https://example.com/api/quiz";

  const url =
    `${QUIZ_EXTERNAL_URL}?` +
    `category=${encodeURIComponent(category)}` +
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

    // TODO: adaptar o mapping conforme a resposta real do fornecedor.
    // Exemplo para Open Trivia DB:
    //   const item = raw?.results?.[0];
    //   const question = String(item?.question ?? "");
    //   const answers = [...(item?.incorrect_answers ?? []), item?.correct_answer].filter(Boolean);
    //   const correctAnswer = item?.correct_answer;
    const item = Array.isArray(raw) ? raw[0] : raw;

    const question = String(item?.question ?? "").trim();
    const answers = Array.isArray(item?.answers) ? item.answers.map(String) : [];
    const correctAnswer =
      typeof item?.correctAnswer === "string" ? item.correctAnswer : undefined;

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
