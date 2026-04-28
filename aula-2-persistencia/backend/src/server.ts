/**
 * Ficheiro de arranque do backend da Aula 2.
 *
 * Responsabilidades:
 * - configurar middleware global (CORS, JSON, metadados de request);
 * - estabelecer ligação à base de dados;
 * - montar rotas de domínio;
 * - tratar erros não capturados;
 * - iniciar o servidor HTTP.
 */
import "dotenv/config";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { connectMongo } from "./db/mongo.js";
import { itemsRouter } from "./routes/items.js";
import { requestMeta } from "./middleware/requestMeta.js";

const app = express();

const PORT = Number(process.env.PORT ?? "3001");
const CORS_ORIGIN = String(process.env.CORS_ORIGIN ?? "http://localhost:5173");

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "200kb" }));
app.use(requestMeta);

/**
 * Endpoint de health check.
 *
 * @returns JSON `{ ok: true }` quando o servidor está ativo.
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const db = await connectMongo();
app.use("/api", itemsRouter(db));

/**
 * Middleware global para erros não tratados nas rotas.
 */
app.use((_err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", _err);
  res.status(500).json({ error: "erro interno" });
});

/**
 * Inicia o servidor na porta configurada.
 */
app.listen(PORT, () => {
  console.log(`Backend up on http://localhost:${PORT}`);
});
