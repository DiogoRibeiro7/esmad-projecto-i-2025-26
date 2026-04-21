# Aula 2 — Persistência de dados

`localStorage` no cliente, MongoDB no servidor, numa aplicação full-stack simples.

## Objectivo

Distinguir **persistência local** (browser) de **persistência remota** (base de dados) e construir uma aplicação pequena mas completa que use as duas. A preferência de tema visual é guardada no browser com `localStorage`. Os itens (um mini to-do list) são guardados em MongoDB através de uma API REST em Express + TypeScript.

## Pergunta orientadora

> **Este dado deve ficar no browser ou deve viver no servidor?**

Esta pergunta evita muitos erros de arquitectura. Preferências visuais e rascunhos leves → browser. Dados do domínio que devem sobreviver ao refresh, ao fecho do browser e à mudança de dispositivo → servidor.

## Arquitectura

```
┌──────────────┐   fetch    ┌──────────────┐   driver    ┌──────────┐
│  Front-end   │──────────▶│  Express API │────────────▶│ MongoDB  │
│  index.html  │            │   /api/...   │             │  items   │
│  app.js      │            └──────────────┘             └──────────┘
│              │
│ localStorage │   (preferências locais: tema)
└──────────────┘
```

| Camada | Responsabilidade |
|--------|------------------|
| Browser / `localStorage` | Preferências locais (tema da interface) |
| Front-end | Recolher input, invocar a API, apresentar resultados e erros |
| API Express | Validar pedidos, aplicar regras, coordenar acesso aos dados |
| MongoDB | Persistir os itens do domínio |

## Pré-requisitos

- Node.js 20+ (`node --version`)
- `npm` (`npm --version`)
- Uma das duas:
  - [Docker](https://www.docker.com/) — recomendado, zero setup adicional
  - [MongoDB Community Server](https://www.mongodb.com/try/download/community) local

## Estrutura

```
aula-2-persistencia/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── server.ts
│       ├── middleware/requestMeta.ts
│       ├── routes/items.ts
│       ├── db/mongo.ts
│       ├── models/item.ts
│       ├── repositories/itemRepository.ts
│       └── utils/http.ts
└── frontend/
    ├── index.html
    └── app.js
```

---

## Passo 1 — MongoDB local

Via Docker (recomendado):

```bash
docker run --rm -d -p 27017:27017 --name mongo-aula mongo:7
```

Para parar no fim:

```bash
docker stop mongo-aula
```

Em alternativa, inicia o `mongod` que já tens instalado na tua máquina.

**Verifica:** a porta 27017 responde — o backend falhará a arrancar com erro claro se a base de dados não estiver disponível.

---

## Passo 2 — Backend

```bash
cd backend
cp .env.example .env
yarn install
yarn dev
```

Na consola deve aparecer `Backend up on http://localhost:3001`.

**Smoke test:**

```bash
curl -s http://localhost:3001/health
# -> {"ok":true}
```

---

## Passo 3 — Front-end

Num terminal separado:

```bash
cd frontend
python -m http.server 5173
```

Ou usa qualquer servidor estático (`npx serve`, extensão Live Server no VS Code, etc.).

Abre http://localhost:5173 no browser.

---

## Passo 4 — Testar o fluxo completo

1. Muda o **tema** no dropdown. Faz refresh da página. O tema mantém-se — isto é `localStorage`.
2. Cria um **item** com título e tags. Faz refresh. O item mantém-se, mesmo se abrires o site noutro browser — isto é MongoDB.
3. Marca um item como `done` e depois apaga-o. Confirma que o `PATCH` e `DELETE` funcionam.

---

## Smoke tests completos

```bash
# health
curl -s http://localhost:3001/health

# listar
curl -s http://localhost:3001/api/items

# criar
curl -s -X POST http://localhost:3001/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"Teste","tags":["aula"]}'

# depois: copiar o _id devolvido e testar PATCH/DELETE
# curl -s -X PATCH http://localhost:3001/api/items/<ID> \
#   -H "Content-Type: application/json" \
#   -d '{"status":"done"}'
#
# curl -i -X DELETE http://localhost:3001/api/items/<ID>
```

---

## Contratos da API

Todos os endpoints de domínio vivem sob `/api`.

| Método | Endpoint | Descrição | Body |
|--------|----------|-----------|------|
| `GET` | `/health` | Verificação de saúde | — |
| `GET` | `/api/items` | Lista itens (até 50, mais recentes primeiro) | — |
| `POST` | `/api/items` | Cria item | `{ title, tags? }` |
| `GET` | `/api/items/:id` | Obtém item | — |
| `PATCH` | `/api/items/:id` | Actualiza parcialmente | `{ title?, status?, tags? }` |
| `DELETE` | `/api/items/:id` | Apaga item | — |

Formato de resposta em sucesso:

```json
{ "data": { /* item ou array de itens */ } }
```

Formato de erro:

```json
{ "error": "mensagem", "details": { } }
```

---

## Nota de segurança

`localStorage` **não** é sítio apropriado para guardar tokens, passwords ou dados sensíveis. Para autenticação real, usa cookies `httpOnly`, sessões no servidor ou outras estratégias apropriadas.

## Erros frequentes

| Sintoma | Causa provável |
|---------|----------------|
| Backend não arranca, mensagem sobre `MONGODB_URI` / `MONGODB_DB` | Falta o ficheiro `.env` ou variáveis mal preenchidas |
| Falha de CORS no browser | `CORS_ORIGIN` no `.env` não coincide com o URL do front-end |
| `POST` devolve `400` | `title` em falta ou vazio |
| UI não actualiza depois de criar | A chamada a `refreshList()` falhou — abrir DevTools |
| `MongoServerError: ECONNREFUSED` | MongoDB não está a correr na porta 27017 |

## Exercícios de extensão

- Filtragem por estado (`?status=open` ou `?status=done`).
- Edição do título directamente na UI.
- Ordenação por data crescente/decrescente.
- Separar respostas de erro de cliente (`4xx`) e falhas internas (`5xx`) de forma mais rica.
- Paginação: `?page=1&pageSize=20` com `meta.total`.
