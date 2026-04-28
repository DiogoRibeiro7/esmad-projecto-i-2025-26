"use strict";

/**
 * Frontend da Aula 2 (persistência local + API REST).
 *
 * Responsabilidades:
 * - gerir preferências locais (tema com localStorage);
 * - chamar backend de itens (CRUD);
 * - renderizar lista e feedback ao utilizador.
 */
const API_BASE = "http://localhost:3001/api";
const PREFS_KEY = "prefs_v1";

const themeEl = document.getElementById("theme");
const titleEl = document.getElementById("title");
const tagsEl = document.getElementById("tags");
const createBtn = document.getElementById("create");
const msgEl = document.getElementById("msg");
const listEl = document.getElementById("list");

/**
 * Mostra mensagem de feedback ao utilizador.
 *
 * @param text Mensagem a apresentar.
 */
function setMsg(text) {
  msgEl.textContent = text || "";
}

/**
 * Faz parse de JSON com fallback em caso de erro.
 *
 * @param raw Texto JSON.
 * @param fallback Valor alternativo se o parse falhar.
 * @returns Objeto parseado ou fallback.
 */
function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Lê preferências guardadas localmente.
 *
 * @returns Objeto de preferências, com default `{ theme: "light" }`.
 */
function loadPrefs() {
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return { theme: "light" };
  return safeJsonParse(raw, { theme: "light" });
}

/**
 * Guarda preferências no localStorage.
 *
 * @param prefs Objeto de preferências.
 */
function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/**
 * Aplica tema visual ao `body`.
 *
 * @param theme Tema selecionado (`light` ou `dark`).
 */
function applyTheme(theme) {
  document.body.style.background = theme === "dark" ? "#111" : "#fff";
  document.body.style.color = theme === "dark" ? "#eee" : "#111";
}

const prefs = loadPrefs();
themeEl.value = prefs.theme;
applyTheme(prefs.theme);

themeEl.addEventListener("change", () => {
  const theme = themeEl.value;
  savePrefs({ theme });
  applyTheme(theme);
});

/**
 * Cliente HTTP utilitário para falar com backend JSON.
 *
 * @param path Caminho relativo da API.
 * @param opts Opções do `fetch`.
 * @returns Payload JSON, `null` em 204, ou lança erro para status não-2xx.
 */
async function apiJson(path, opts) {
  const res = await fetch(`${API_BASE}${path}`, opts);
  const isJson = (res.headers.get("content-type") || "").includes("application/json");

  if (res.status === 204) return null;

  const payload = isJson ? await res.json() : { error: await res.text() };

  if (!res.ok) {
    const msg = payload && payload.error ? payload.error : `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.details = payload && payload.details ? payload.details : undefined;
    throw err;
  }

  return payload;
}

/**
 * Converte input CSV simples em array de tags.
 *
 * @param s Texto com tags separadas por vírgula.
 * @returns Array de strings já trimmed e sem vazios.
 */
function parseTags(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

/**
 * Renderiza um item da lista com botões de ação.
 *
 * @param item Item devolvido pela API.
 * @returns Elemento `<li>` pronto a adicionar ao DOM.
 */
function renderItem(item) {
  const li = document.createElement("li");

  const title = document.createElement("span");
  title.textContent = `${item.title} [${item.status}]`;

  const tags = document.createElement("span");
  tags.className = "muted";
  tags.textContent = item.tags && item.tags.length
    ? `tags: ${item.tags.join(", ")}`
    : "tags: -";
  tags.style.marginLeft = "8px";

  const doneBtn = document.createElement("button");
  doneBtn.textContent = item.status === "done" ? "Reabrir" : "Done";

  const delBtn = document.createElement("button");
  delBtn.textContent = "Delete";

  /**
   * Alterna estado do item entre `open` e `done`.
   */
  doneBtn.addEventListener("click", async () => {
    setMsg("A atualizar...");
    try {
      const next = item.status === "done" ? "open" : "done";
      await apiJson(`/items/${item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      setMsg("Atualizado.");
      await refreshList();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    }
  });

  /**
   * Apaga item após confirmação do utilizador.
   */
  delBtn.addEventListener("click", async () => {
    if (!confirm("Apagar item?")) return;
    setMsg("A apagar...");
    try {
      await apiJson(`/items/${item._id}`, { method: "DELETE" });
      setMsg("Apagado.");
      await refreshList();
    } catch (e) {
      setMsg(`Erro: ${e.message}`);
    }
  });

  li.appendChild(title);
  li.appendChild(tags);
  li.appendChild(document.createTextNode(" "));
  li.appendChild(doneBtn);
  li.appendChild(delBtn);

  return li;
}

/**
 * Recarrega a lista completa de itens no ecrã.
 */
async function refreshList() {
  const out = await apiJson("/items", { method: "GET" });
  listEl.innerHTML = "";

  if (!out.data.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "Ainda nao existem itens.";
    listEl.appendChild(li);
    return;
  }

  for (const item of out.data) {
    listEl.appendChild(renderItem(item));
  }
}

/**
 * Handler principal para criação de item.
 */
createBtn.addEventListener("click", async () => {
  const title = String(titleEl.value || "").trim();
  const tags = parseTags(tagsEl.value);

  if (!title) {
    setMsg("Titulo obrigatorio.");
    return;
  }

  setMsg("A criar...");
  try {
    await apiJson("/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, tags })
    });

    titleEl.value = "";
    tagsEl.value = "";
    setMsg("Criado.");
    await refreshList();
  } catch (e) {
    setMsg(`Erro: ${e.message}`);
  }
});

refreshList().catch(() => setMsg("Nao foi possivel carregar a lista."));
