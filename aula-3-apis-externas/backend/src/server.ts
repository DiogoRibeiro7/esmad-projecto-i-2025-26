import "dotenv/config";
import express from "express";
import cors from "cors";
import { extQuizRouter } from "./routes/extQuiz.js";

const app = express();

const PORT = Number(process.env.PORT ?? "3001");
const CORS_ORIGIN = String(process.env.CORS_ORIGIN ?? "http://localhost:5173");

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "200kb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", extQuizRouter);

app.listen(PORT, () => {
  console.log(`Backend up on http://localhost:${PORT}`);
});
