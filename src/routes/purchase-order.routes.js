import { Router } from "express";

import {
    showCreatePurchaseOrderPage,
    showPurchaseOrdersPage,
    storePurchaseOrder
} from "../controllers/purchase-order.controller.js";

const router = Router();

router.get(
    "/purchase-orders/new",
    showCreatePurchaseOrderPage
);

router.get(
    "/purchase-orders",
    showPurchaseOrdersPage
);

router.post(
    "/purchase-orders",
    storePurchaseOrder
);

export default router;