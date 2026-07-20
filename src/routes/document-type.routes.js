import { Router } from "express";

import {
    showCreateDocumentTypePage,
    showDocumentTypesPage
} from "../controllers/document-type.controller.js";

const router = Router();

router.get(
    "/document-types/new",
    showCreateDocumentTypePage
);

router.get(
    "/document-types",
    showDocumentTypesPage
);

export default router;