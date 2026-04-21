"use strict";

const API_BASE = "http://localhost:3001/api";
const PREFS_KEY = "prefs_v1";

const themeEl = document.getElementById("theme");
const titleEl = document.getElementById("title");
const tagsEl = document.getElementById("tags");
const createBtn = document.getElementById("create");
const msgEl = document.getElementById("msg");
const listEl = document.getElementById("list");

function setMsg(text) {
  msgEl.textContent = text || "";
}

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadPrefs() {
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return { theme: "light" };
  return safeJsonParse(raw, { theme: "light" });
}

function savePrefs(prefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

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

function parseTags(s) {
  return String(s || "")
    .split(",")
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

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
