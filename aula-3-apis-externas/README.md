# Aula 3 — Integração de APIs externas

Padrão **UI → Gateway → API externa**, com uma Quiz API como caminho principal e Google Maps como extensão (em anexo).

## Objectivo

Integrar uma API externa no projecto, com uma arquitectura segura e reutilizável. O front-end nunca chama directamente a API externa. Chama sempre o teu backend, que por sua vez fala com o fornecedor e devolve uma resposta **normalizada** ao cliente.

## Pergunta orientadora

> **Este pedido deve sair directamente do browser para a API externa, ou deve passar primeiro pelo meu backend?**

Em praticamente todos os casos relevantes, a resposta é: passar pelo backend. Mesmo que a API escolhida não exija chave, o padrão mantém-se: o backend é o único ponto onde se constrói o URL externo, se aplicam credenciais, se traduzem erros e se normaliza a forma da resposta.

## Arquitectura

```
┌──────────────┐   /api/ext/...   ┌──────────────┐   fetch   ┌──────────────┐
│  Front-end   │─────────────────▶│   Gateway    │──────────▶│ API externa  │
│  index.html  │                  │  (backend)   │           │  (quiz/maps) │
│  app.js      │◀─────────────────│              │◀──────────│              │
└──────────────┘  { data, meta }  └──────────────┘   JSON    └──────────────┘
```

| Camada | Responsabilidade |
|--------|------------------|
| Front-end | Recolher input, invocar o backend, apresentar `loading`/sucesso/erro |
| Route | Validar inputs, chamar provider, traduzir falhas, devolver contrato estável |
| Provider | Construir URL externo, fazer `fetch`, normalizar resposta, isolar fornecedor |
| API externa | Fornecer dados originais (formato e regras do fornecedor) |

## Contrato interno

Endpoint exposto:

```
GET /api/ext/quiz/question?category=general&difficulty=easy
```

Resposta normalizada (sempre neste formato):

```json
{
  "data": {
    "question": "....",
    "answers": ["A", "B", "C", "D"],
    "correctAnswer": "B"
  },
  "meta": { "provider": "quiz", "cached": false }
}
```

## Pré-requisitos

- Node.js 20+
- `npm`
- `curl` para os smoke tests
- Acesso à Internet (o provider chama um serviço externo)

## Estrutura

```
aula-3-apis-externas/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── server.ts
│       ├── providers/quizProvider.ts
│       ├── routes/extQuiz.ts
│       └── utils/cache.ts
└── frontend/
    ├── index.html
    └── app.js
```

---

## Passo 1 — Escolher o fornecedor externo

O `quizProvider.ts` vem com um `QUIZ_EXTERNAL_URL` **placeholder** (`https://example.com/api/quiz`). Antes de arrancar, substitui por uma API real. Opções de baixa fricção:

- [Open Trivia DB](https://opentdb.com/) — `https://opentdb.com/api.php?amount=1&category=9&difficulty=easy`
- [QuizAPI.io](https://quizapi.io/) — requer chave
- Qualquer outra API pública de quiz

Ao trocar o URL, **também** precisas de ajustar o mapeamento no provider (a estrutura de cada fornecedor é diferente). Procura os dois blocos `// TODO:` em `src/providers/quizProvider.ts`.

---

## Passo 2 — Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Deves ver `Backend up on http://localhost:3001`.

**Smoke test:**

```bash
curl -s "http://localhost:3001/api/ext/quiz/question?category=general&difficulty=easy"
```

Se devolver `502` ou `504`, provavelmente o `QUIZ_EXTERNAL_URL` ainda é o placeholder ou o mapeamento não corresponde à resposta real.

---

## Passo 3 — Front-end

Num terminal separado:

```bash
cd frontend
python -m http.server 5173
```

Abre http://localhost:5173.

---

## Passo 4 — Testar o fluxo completo

1. Escolhe uma categoria e dificuldade, clica **Nova pergunta**.
2. Deves ver `A carregar...` e depois a pergunta + opções.
3. Apaga o `category`, clica de novo. Deves ver uma mensagem clara de erro (400).
4. Muda temporariamente o `QUIZ_EXTERNAL_URL` no provider para `https://example.invalid/api` e tenta de novo. Deves ver erro controlado (`502`/`504`), nunca uma stack trace.

---

## Smoke tests

```bash
# pedido valido
curl -s "http://localhost:3001/api/ext/quiz/question?category=general&difficulty=easy" | head

# input invalido (400)
curl -i "http://localhost:3001/api/ext/quiz/question?category=&difficulty=easy"
```

---

## Checkpoints de laboratório

| Minuto | Marco |
|--------|-------|
| 35 | Endpoint interno responde com dados válidos no `curl` |
| 60 | UI mostra pergunta e opções |
| 95 | Pelo menos um caso de erro tratado (400 ou serviço indisponível) |
| 110 | Logs com estado e latência por pedido |

## Regra de ouro

**Não expor API keys.** Mesmo quando a API não exige chave:

- o front-end chama apenas o teu backend
- o backend chama a API externa
- o formato devolvido à UI é normalizado por ti

O ficheiro `.env` **nunca** é commitado. Está no `.gitignore`.

## Erros frequentes

| Sintoma | Causa provável |
|---------|----------------|
| Sempre `502` | `QUIZ_EXTERNAL_URL` ainda é o placeholder ou mapeamento não corresponde à resposta |
| Sempre `504` | Timeout baixo demais (default 3500 ms) ou rede instável |
| UI não mostra nada | `CORS_ORIGIN` no `.env` não coincide com o URL do front-end |
| `429` do fornecedor | Rate limit — activar caching (ver `src/utils/cache.ts`) |
| Erro de CORS no browser | Front-end a chamar directamente a API externa em vez do backend |

## Exercícios de extensão

- Activar a `cache` (ver `src/utils/cache.ts`) e reflectir o estado em `meta.cached`.
- Esconder `correctAnswer` da resposta e criar um endpoint adicional que valida a tentativa.
- Substituir o fornecedor externo por outro, mantendo o contrato interno intacto.
- Adicionar debouncing no front-end (ver secção no anexo abaixo).

---

## Anexo — Google Maps como extensão

A aula base é deliberadamente sobre um fornecedor de baixa fricção. O Google Maps fica em anexo porque implica:

- Projecto na Google Cloud com billing activo
- Gestão de credenciais e restrições da API key
- SDKs e UI específicas (map render)

### Mesmo padrão

```
UI → /api/ext/maps/... → Maps API
```

Endpoints internos sugeridos:

```
GET /api/ext/maps/geocode?query=Rua%20X
GET /api/ext/maps/places?query=cafe%20porto
GET /api/ext/maps/distance?from=...&to=...
```

### Checklist de implementação

1. Criar `src/providers/mapsProvider.ts` com `fetch` e normalização.
2. Criar `src/routes/extMaps.ts` com validação e contrato `{ data, meta }`.
3. Guardar a chave em `MAPS_API_KEY` no `.env` (garantir que `.env` está no `.gitignore`).
4. Restringir a chave por domínio/IP na consola Google Cloud.
5. Implementar UI: input + lista de resultados (+ mapa, opcional).
6. Tratar `429` (quota) e `403` (permissões).

### Debounce para pesquisa em tempo real

```javascript
function debounce(fn, waitMs) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}
```

Envolve o handler de `input` com `debounce(handler, 300)` para evitar chamadas a cada tecla.
