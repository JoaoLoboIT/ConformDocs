import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import documentRoutes from "./routes/document.routes.js";
import documentTypeRoutes from "./routes/document-type.routes.js";
import indexRoutes from "./routes/index.routes.js";
import purchaseOrderRoutes from "./routes/purchase-order.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";
import { errorHandlerMiddleware } from "./middlewares/error-handler.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";
import { viewLocalsMiddleware } from "./middlewares/view-locals.middleware.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const projectRoot = path.resolve(currentDirectoryPath, "..");

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("view engine", "ejs");
  app.set("views", path.join(currentDirectoryPath, "views"));

  app.use(express.urlencoded({ extended: true, limit: "12mb" }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.static(path.join(currentDirectoryPath, "public")));
  app.use("/uploads", express.static(path.join(projectRoot, "uploads")));
  app.use(viewLocalsMiddleware);

  app.use(indexRoutes);
  app.use(supplierRoutes);
  app.use(purchaseOrderRoutes);
  app.use(documentTypeRoutes);
  app.use(documentRoutes);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
