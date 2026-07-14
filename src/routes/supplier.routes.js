import { Router } from "express";

import {
    showCreateSupplierPage,
    showSuppliersPage,
    storeSupplier
} from "../controllers/supplier.controller.js";

const router = Router();

router.get("/suppliers/new", showCreateSupplierPage);
router.get("/suppliers", showSuppliersPage);
router.post("/suppliers", storeSupplier);

export default router;