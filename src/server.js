import { createApp } from "./app.js";
import { connectToDatabase } from "./config/database.js";

const DEFAULT_PORT = 3000;
const port = Number(process.env.PORT) || DEFAULT_PORT;

async function startServer() {
    try {
        await connectToDatabase();

        console.log("MongoDB conectado com sucesso.");

        const app = createApp();

        app.listen(port, () => {
            console.log(
                `ConformDocs iniciado em http://localhost:${port}`
            );
        });
    } catch (error) {
        console.error("Não foi possível iniciar o ConformDocs:");
        console.error(error);

        process.exit(1);
    }
}

startServer();