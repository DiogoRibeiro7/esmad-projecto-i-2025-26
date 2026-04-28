# Documentação Completa — Ficheiros e Funções (Aula 3)

Este documento descreve **cada ficheiro** da aula e **todas as funções principais**.
Objetivo: ajudar alunos de 1.º ano a perceber rapidamente onde alterar código e porquê.

## Visão global

Arquitetura:

1. `frontend` recolhe input e chama backend interno.
2. `backend/routes` valida o pedido HTTP.
3. `backend/providers` chama a API externa.
4. Backend devolve formato normalizado ao frontend.

## Ficheiros do backend

### `backend/src/server.ts`
Função do ficheiro:
- ponto de entrada da aplicação backend.
- configura CORS e parser JSON.
- monta rotas em `/api`.
- inicia servidor na porta definida.

Funções/handlers:
1. `app.get("/health", ...)`
   - endpoint de diagnóstico.
   - devolve `{ ok: true }`.
2. `app.listen(PORT, ...)`
   - arranca o processo HTTP.

### `backend/src/routes/extQuiz.ts`
Função do ficheiro:
- definir rota externa interna de quiz.
- validar query params.
- transformar erros técnicos em respostas HTTP úteis para o cliente.

Funções:
1. `isNonEmptyString(x)`
   - valida se o input é string com conteúdo.
2. `isDifficulty(x)`
   - valida dificuldade permitida (`easy|medium|hard`).
3. `extQuizRouter.get("/ext/quiz/question", ...)`
   - valida `category` + `difficulty`.
   - chama `fetchQuizQuestion(...)`.
   - devolve:
     - sucesso: `{ data, meta }`
     - erro: `400`, `429`, `502` ou `504`.

### `backend/src/providers/quizProvider.ts`
Função do ficheiro:
- isolar a chamada real ao fornecedor externo de quiz.
- normalizar resposta externa para um contrato interno estável.

Tipos:
1. `Difficulty`
2. `QuizQuestion`
3. `QuizFetchResult`

Função:
1. `fetchQuizQuestion(params)`
   - constrói URL externa.
   - aplica timeout com `AbortController`.
   - faz `fetch`.
   - valida shape da resposta.
   - retorna formato interno:
     - `provider: "quiz"`
     - `data: { question, answers, correctAnswer }`

### `backend/src/utils/cache.ts`
Função do ficheiro:
- fornecer cache simples em memória com expiração por tempo (TTL).

Funções:
1. `getCache(key)`
   - devolve valor se existir e estiver válido.
   - remove e devolve `null` se expirado.
2. `setCache(key, value, ttlMs)`
   - guarda valor com timestamp de expiração.

## Ficheiros do frontend

### `frontend/index.html`
Função do ficheiro:
- estrutura base da UI.
- campos de input (`category`, `difficulty`), botão e área de output.
- estilos CSS simples para leitura.

### `frontend/app.js`
Função do ficheiro:
- lógica de interação com utilizador.
- chamadas ao backend (`/api/ext/quiz/question`).
- renderização de pergunta e feedback.

Funções:
1. `setStatus(text, isError)`
   - escreve mensagens de estado.
2. `clearQuestion()`
   - limpa output anterior.
3. `fetchQuestion(category, difficulty)`
   - chama backend e trata erros HTTP conhecidos.
4. `renderQuestion(payload)`
   - desenha pergunta e respostas no DOM.
   - valida resposta escolhida contra `correctAnswer`.
5. handler `askBtn.addEventListener("click", ...)`
   - fluxo principal do UI: validar -> pedir -> renderizar.

## Ficheiros de suporte

### `README.md`
- guia de execução da aula.
- arquitetura e contratos HTTP.
- passos de setup e testes.

## Como fazer alterações sem quebrar

1. Muda primeiro no provider quando o fornecedor externo muda.
2. Mantém o contrato do route (`{ data, meta }`) estável.
3. Só depois ajusta o frontend, se necessário.
4. Testa por ordem:
   - `/health`
   - endpoint de quiz via `curl`
   - interface no browser.

