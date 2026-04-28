/**
 * Ficheiro de arranque do backend da Aula 3.
 *
 * Responsabilidades principais:
 * - carregar variáveis de ambiente;
 * - configurar middleware global (CORS e JSON parser);
 * - expor endpoint de health check;
 * - montar rotas de API;
 * - iniciar o servidor HTTP.
 */
import "dotenv/config";
import express from "express";
import cors from "cors";
import { extQuizRouter } from "./routes/extQuiz.js";

const app = express();

const PORT = Number(process.env.PORT ?? "3002");
const CORS_ORIGIN = String(process.env.CORS_ORIGIN ?? "http://localhost:5173");

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "200kb" }));

/**
 * Endpoint de health check.
 *
 * @returns JSON `{ ok: true }` para confirmar que o backend está activo.
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", extQuizRouter);

/**
 * Arranca o servidor HTTP na porta configurada.
 */
app.listen(PORT, () => {
  console.log(`Backend up on http://localhost:${PORT}`);
});
