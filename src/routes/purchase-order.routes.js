import { Router } from "express";
import {
  cancelPurchaseOrderRecord,
  showCreatePurchaseOrderPage,
  showPurchaseOrderDetailsPage,
  showPurchaseOrdersPage,
  storePurchaseOrder,
} from "../controllers/purchase-order.controller.js";

const router = Router();
router.get("/purchase-orders", showPurchaseOrdersPage);
router.get("/purchase-orders/new", showCreatePurchaseOrderPage);
router.get("/purchase-orders/:id", showPurchaseOrderDetailsPage);
router.post("/purchase-orders", storePurchaseOrder);
router.post("/purchase-orders/:id/cancel", cancelPurchaseOrderRecord);
export default router;
