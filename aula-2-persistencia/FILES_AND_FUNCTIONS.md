# Documentação Completa — Ficheiros e Funções (Aula 2)

Este documento explica **todos os ficheiros de código** da Aula 2 e a função de
cada função/método principal.

## Arquitetura resumida

1. Frontend (`frontend/app.js`) recolhe input e chama API.
2. Backend (`backend/src/routes/items.ts`) valida e processa pedidos.
3. Repository (`backend/src/repositories/itemRepository.ts`) fala com MongoDB.
4. Mongo guarda os dados de itens.
5. `localStorage` guarda preferências de tema no browser.

## Backend

### `backend/src/server.ts`
- Entry-point do backend.
- Configura middleware global e CORS.
- Liga à base de dados.
- Monta router de itens.
- Define health check e error handler.

Handlers:
1. `app.get("/health", ...)`
2. `app.use((_err, _req, res, _next) => ...)`
3. `app.listen(PORT, ...)`

### `backend/src/db/mongo.ts`
- Responsável por abrir/reutilizar ligação MongoDB.

Funções:
1. `connectMongo()`
   - lê `MONGODB_URI` e `MONGODB_DB`;
   - liga ao Mongo na primeira chamada;
   - devolve `Db`.

### `backend/src/middleware/requestMeta.ts`
- Middleware de observabilidade.

Funções:
1. `requestMeta(req, res, next)`
   - cria request id;
   - define header `x-request-id`;
   - mede latência e faz log ao finalizar.

### `backend/src/models/item.ts`
- Tipos de domínio de item.
- Regras de validação/sanitização.

Funções:
1. `isItemStatus(x)`
2. `normalizeTags(x)`

### `backend/src/repositories/itemRepository.ts`
- Camada de acesso a dados.
- Encapsula operações CRUD no MongoDB.

Métodos:
1. `constructor(db)`
2. `ensureIndexes()`
3. `create(input, nowIso)`
4. `list(limit)`
5. `getById(id)`
6. `patch(id, patch, nowIso)`
7. `delete(id)`

### `backend/src/routes/items.ts`
- Define rotas REST de itens.
- Valida input e mapeia respostas/erros HTTP.

Funções auxiliares:
1. `asyncHandler(fn)`
2. `badRequest(res, error, details?)`
3. `notFound(res)`
4. `itemsRouter(db)`

Rotas:
1. `GET /items`
2. `POST /items`
3. `GET /items/:id`
4. `PATCH /items/:id`
5. `DELETE /items/:id`

### `backend/src/utils/http.ts`
- Helpers reutilizáveis.

Funções:
1. `nowIso()`
2. `makeReqId()`
3. `isNonEmptyString(x)`
4. `clampString(x, maxLen)`

## Frontend

### `frontend/index.html`
- Estrutura visual da aplicação.
- Inputs para criar itens e escolher tema.
- Áreas de feedback e lista.

### `frontend/app.js`
- Lógica de UI e integração com backend.
- Gestão de preferências locais no browser.

Funções:
1. `setMsg(text)`
2. `safeJsonParse(raw, fallback)`
3. `loadPrefs()`
4. `savePrefs(prefs)`
5. `applyTheme(theme)`
6. `apiJson(path, opts)`
7. `parseTags(s)`
8. `renderItem(item)`
9. `refreshList()`
10. handler `createBtn.addEventListener("click", ...)`
11. handler `themeEl.addEventListener("change", ...)`

## Regra prática para alterar sem quebrar

1. Mudanças de dados: `models` -> `routes` -> `repository`.
2. Mudanças de UI: `index.html` -> `app.js`.
3. Sempre testar:
   - `GET /health`
   - endpoints com `curl`
   - fluxo final no browser.

