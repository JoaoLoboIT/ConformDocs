import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import indexRoutes from "./routes/index.routes.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);

export function createApp() {
    const app = express();

    app.disable("x-powered-by");

    app.set("view engine", "ejs");
    app.set(
        "views",
        path.join(currentDirectoryPath, "views")
    );

    app.use(indexRoutes);

    return app;
}