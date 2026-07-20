import { Router } from "express";
import {
  showCreateDocumentTypePage,
  showDocumentTypesPage,
  showEditDocumentTypePage,
  storeDocumentType,
  updateDocumentTypeRecord,
} from "../controllers/document-type.controller.js";

const router = Router();
router.get("/document-types", showDocumentTypesPage);
router.get("/document-types/new", showCreateDocumentTypePage);
router.get("/document-types/:id/edit", showEditDocumentTypePage);
router.post("/document-types", storeDocumentType);
router.post("/document-types/:id/edit", updateDocumentTypeRecord);
export default router;
