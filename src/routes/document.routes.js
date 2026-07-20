import { Router } from "express";
import {
  addDivergenceCommentRecord,
  approveDocumentRecord,
  deleteDocumentRecord,
  integrateDocumentRecord,
  rejectDocumentRecord,
  resolveDivergenceRecord,
  revalidateDocumentRecord,
  showCreateDocumentPage,
  showDocumentDetailsPage,
  showDocumentsPage,
  showEditDocumentPage,
  storeDocument,
  updateDocumentRecord,
} from "../controllers/document.controller.js";

const router = Router();
router.get("/documents", showDocumentsPage);
router.get("/documents/new", showCreateDocumentPage);
router.get("/documents/:id/edit", showEditDocumentPage);
router.get("/documents/:id", showDocumentDetailsPage);
router.post("/documents", storeDocument);
router.post("/documents/:id/edit", updateDocumentRecord);
router.post("/documents/:id/revalidate", revalidateDocumentRecord);
router.post("/documents/:id/approve", approveDocumentRecord);
router.post("/documents/:id/reject", rejectDocumentRecord);
router.post("/documents/:id/integrate", integrateDocumentRecord);
router.post("/documents/:id/delete", deleteDocumentRecord);
router.post(
  "/documents/:id/divergences/:divergenceId/comments",
  addDivergenceCommentRecord,
);
router.post(
  "/documents/:id/divergences/:divergenceId/resolve",
  resolveDivergenceRecord,
);
export default router;
