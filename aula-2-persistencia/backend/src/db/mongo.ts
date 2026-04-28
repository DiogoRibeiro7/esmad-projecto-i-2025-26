/**
 * Gestão de ligação MongoDB para a Aula 2.
 *
 * Este módulo mantém uma ligação partilhada (singleton simples) para evitar
 * reconectar a cada pedido.
 */
import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

/**
 * Cria (na primeira chamada) e devolve a ligação à base de dados MongoDB.
 *
 * @throws Error quando `MONGODB_URI` ou `MONGODB_DB` não estão definidos.
 * @returns Instância `Db` pronta a usar.
 */
export async function connectMongo(): Promise<Db> {
  if (db) return db;

  const uri = String(process.env.MONGODB_URI ?? "").trim();
  const dbName = String(process.env.MONGODB_DB ?? "").trim();

  if (!uri) throw new Error("MONGODB_URI not set");
  if (!dbName) throw new Error("MONGODB_DB not set");

  client = new MongoClient(uri);
  await client.connect();

  db = client.db(dbName);
  return db;
}
