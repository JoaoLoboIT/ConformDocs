import { createApp } from "./app.js";
import {
  closeDatabaseConnection,
  connectToDatabase,
} from "./config/database.js";

const DEFAULT_PORT = 3000;
const port = Number(process.env.PORT) || DEFAULT_PORT;

async function startServer() {
  try {
    await connectToDatabase();
    console.log("MongoDB conectado com sucesso.");

    const app = createApp();
    const server = app.listen(port, () => {
      console.log(`ConformDocs iniciado em http://localhost:${port}`);
    });

    const shutdown = async () => {
      console.log("Encerrando ConformDocs...");
      server.close(async () => {
        await closeDatabaseConnection();
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Não foi possível iniciar o ConformDocs:");
    console.error(error);
    process.exit(1);
  }
}

startServer();
