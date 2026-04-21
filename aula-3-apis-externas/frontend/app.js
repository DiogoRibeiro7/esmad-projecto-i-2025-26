"use strict";

const API_BASE = "http://localhost:3002/api";

const categoryEl = document.getElementById("category");
const difficultyEl = document.getElementById("difficulty");
const askBtn = document.getElementById("ask");
const statusEl = document.getElementById("status");
const questionArea = document.getElementById("question-area");

function setStatus(text, isError) {
  statusEl.textContent = text || "";
  statusEl.className = isError ? "error" : "muted";
}

function clearQuestion() {
  questionArea.innerHTML = "";
}

async function fetchQuestion(category, difficulty) {
  const url = `${API_BASE}/ext/quiz/question?category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(difficulty)}`;
  const res = await fetch(url);

  if (res.status === 400) throw new Error("Pedido invalido. Confirma os campos.");
  if (res.status === 429) throw new Error("Limite atingido. Tenta novamente em 1 minuto.");
  if (!res.ok) throw new Error("Servico indisponivel. Tenta mais tarde.");

  return res.json();
}

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
