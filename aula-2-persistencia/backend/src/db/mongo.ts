import { MongoClient, type Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

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
