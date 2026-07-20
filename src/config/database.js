import { MongoClient } from "mongodb";

const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DATABASE;

if (!mongoUri || !databaseName) {
  throw new Error(
    "As variáveis MONGODB_URI e MONGODB_DATABASE são obrigatórias.",
  );
}

const client = new MongoClient(mongoUri, {
  appName: "ConformDocs",
});

let database;

export async function connectToDatabase() {
  if (database) {
    return database;
  }

  await client.connect();
  await client.db("admin").command({ ping: 1 });
  database = client.db(databaseName);
  return database;
}

export function getDatabase() {
  if (!database) {
    throw new Error("O banco de dados ainda não foi conectado.");
  }

  return database;
}

export async function closeDatabaseConnection() {
  await client.close();
  database = undefined;
}
