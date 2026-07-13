import { createApp } from "./app.js";

const PORT = 3000;

const app = createApp();

app.listen(PORT, () => {
    console.log(`ConformDocs iniciado em http://localhost:${PORT}`);
});