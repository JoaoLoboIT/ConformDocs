import { Router } from "express";

import {
    showCreateSupplierPage,
    showSupplierDetailsPage,
    showSuppliersPage,
    storeSupplier
} from "../controllers/supplier.controller.js";

const router = Router();

router.get("/suppliers/new", showCreateSupplierPage);
router.get("/suppliers", showSuppliersPage);
router.get("/suppliers/:id", showSupplierDetailsPage);
router.post("/suppliers", storeSupplier);

export default router;