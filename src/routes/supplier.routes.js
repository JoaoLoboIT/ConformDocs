import { Router } from "express";

import {
    showCreateSupplierPage,
    showEditSupplierPage,
    showSupplierDetailsPage,
    showSuppliersPage,
    storeSupplier,
    updateSupplierRecord
} from "../controllers/supplier.controller.js";

const router = Router();

router.get("/suppliers/new", showCreateSupplierPage);
router.get("/suppliers", showSuppliersPage);
router.get("/suppliers/:id/edit", showEditSupplierPage);
router.get("/suppliers/:id", showSupplierDetailsPage);

router.post("/suppliers", storeSupplier);
router.post("/suppliers/:id/edit", updateSupplierRecord);

export default router;