"use strict";

/**
 * Script principal do frontend da Aula 3.
 *
 * Responsabilidades:
 * - ler input do utilizador;
 * - chamar o endpoint interno `/api/ext/quiz/question`;
 * - renderizar pergunta, respostas e feedback;
 * - apresentar mensagens de erro de forma amigável.
 */
const API_BASE = "http://localhost:3002/api";

const categoryEl = document.getElementById("category");
const difficultyEl = document.getElementById("difficulty");
const askBtn = document.getElementById("ask");
const statusEl = document.getElementById("status");
const questionArea = document.getElementById("question-area");

/**
 * Escreve mensagem de estado no ecrã.
 *
 * @param text Texto de feedback para o utilizador.
 * @param isError Quando `true`, aplica classe visual de erro.
 * @returns Nada (`void`).
 */
function setStatus(text, isError) {
  statusEl.textContent = text || "";
  statusEl.className = isError ? "error" : "muted";
}

/**
 * Limpa a área da pergunta antes de novo render.
 *
 * @returns Nada (`void`).
 */
function clearQuestion() {
  questionArea.innerHTML = "";
}

/**
 * Faz pedido ao backend (gateway interno), não diretamente à API externa.
 *
 * @param category Categoria escolhida.
 * @param difficulty Dificuldade escolhida.
 * @throws Error com mensagem user-friendly quando HTTP não é 2xx.
 * @returns Payload JSON normalizado pelo backend.
 */
async function fetchQuestion(category, difficulty) {
  const url = `${API_BASE}/ext/quiz/question?category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}`;
  const res = await fetch(url);

  if (res.status === 400) throw new Error("Pedido invalido. Confirma os campos.");
  if (res.status === 429) throw new Error("Limite atingido. Tenta novamente em 1 minuto.");
  if (!res.ok) throw new Error("Servico indisponivel. Tenta mais tarde.");

  return res.json();
}

/**
 * Renderiza pergunta, lista de respostas e metadados.
 *
 * @param payload Resposta já normalizada do backend.
 * @returns Nada (`void`).
 */
function renderQuestion(payload) {
  clearQuestion();

  const wrapper = document.createElement("div");
  wrapper.className = "question";

  const q = document.createElement("p");
  q.innerHTML = `<strong>${payload.data.question}</strong>`;

  const list = document.createElement("ul");
  list.className = "answers";

  payload.data.answers.forEach((ans) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.textContent = ans;
    btn.addEventListener("click", () => {
      const correct = payload.data.correctAnswer;
      if (correct === undefined) {
        setStatus(`Respondeste: ${ans}`);
      } else if (ans === correct) {
        setStatus("Correcto!");
      } else {
        setStatus(`Errado. Resposta: ${correct}`, true);
      }
    });
    li.appendChild(btn);
    list.appendChild(li);
  });

  const meta = document.createElement("p");
  meta.className = "muted";
  meta.textContent = `provider: ${payload.meta.provider} | cached: ${payload.meta.cached}`;

  wrapper.appendChild(q);
  wrapper.appendChild(list);
  wrapper.appendChild(meta);

  questionArea.appendChild(wrapper);
}

/**
 * Handler principal do botão "Nova pergunta".
 *
 * Fluxo:
 * 1) valida input;
 * 2) bloqueia botão para evitar cliques repetidos;
 * 3) chama backend;
 * 4) renderiza output ou erro;
 * 5) desbloqueia botão no final.
 */
askBtn.addEventListener("click", async () => {
  const category = String(categoryEl.value || "").trim();
  const difficulty = String(difficultyEl.value || "").trim();

  if (!category) {
    setStatus("Categoria obrigatoria.", true);
    return;
  }

  askBtn.disabled = true;
  setStatus("A carregar...");
  clearQuestion();

  try {
    const payload = await fetchQuestion(category, difficulty);
    setStatus("");
    renderQuestion(payload);
  } catch (e) {
    setStatus(e.message, true);
  } finally {
    askBtn.disabled = false;
  }
});
