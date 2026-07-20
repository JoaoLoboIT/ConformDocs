import { AppError } from "../errors/app-error.js";
import {
  cancelPurchaseOrderById,
  findAllPurchaseOrders,
  findAvailablePurchaseOrders,
  findPurchaseOrderById,
  findPurchaseOrderByNumber,
  insertPurchaseOrder,
} from "../repositories/purchase-order.repository.js";
import { registerAudit } from "./audit.service.js";
import { getSupplierById } from "./supplier.service.js";

export async function listPurchaseOrders(filters = {}) {
  return findAllPurchaseOrders(filters);
}

export async function listAvailablePurchaseOrders() {
  return findAvailablePurchaseOrders();
}

export async function getPurchaseOrderById(id) {
  const purchaseOrder = await findPurchaseOrderById(id);
  if (!purchaseOrder)
    throw new AppError("Pedido de compra não encontrado.", 404);
  return purchaseOrder;
}

export async function createPurchaseOrder(data) {
  const orderNumber = data.orderNumber?.trim().toUpperCase();
  const supplierId = data.supplierId;
  const costCenter = data.costCenter?.trim();
  const description = data.description?.trim();
  const totalAmount = Number(data.totalAmount);
  const issueDate = new Date(`${data.issueDate}T12:00:00`);

  if (
    !orderNumber ||
    !supplierId ||
    !costCenter ||
    !description ||
    !data.issueDate
  ) {
    throw new AppError("Todos os campos são obrigatórios.");
  }
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new AppError("O valor total deve ser maior que zero.");
  }
  if (Number.isNaN(issueDate.getTime()))
    throw new AppError("A data de emissão é inválida.");
  if (await findPurchaseOrderByNumber(orderNumber)) {
    throw new AppError("Já existe um pedido com este número.");
  }

  const supplier = await getSupplierById(supplierId);
  if (supplier.status !== "ACTIVE")
    throw new AppError("O fornecedor selecionado está inativo.");

  const now = new Date();
  const created = await insertPurchaseOrder({
    orderNumber,
    supplierId: supplier._id,
    supplierSnapshot: {
      tradeName: supplier.tradeName,
      legalName: supplier.legalName,
      cnpj: supplier.cnpj,
    },
    issueDate,
    costCenter,
    description,
    totalAmount,
    remainingAmount: totalAmount,
    status: "OPEN",
    linkedDocuments: [],
    statusHistory: [
      { status: "OPEN", changedAt: now, note: "Pedido cadastrado." },
    ],
    createdAt: now,
    updatedAt: now,
  });

  await registerAudit({
    entityType: "PURCHASE_ORDER",
    entityId: created._id,
    action: "CREATE",
    description: `Pedido ${created.orderNumber} cadastrado.`,
  });

  return created;
}

export async function cancelPurchaseOrder(id, reason) {
  const purchaseOrder = await getPurchaseOrderById(id);
  if (!["OPEN", "PARTIALLY_USED"].includes(purchaseOrder.status)) {
    throw new AppError("Somente pedidos abertos podem ser cancelados.");
  }

  const cancellationReason = reason?.trim();
  if (!cancellationReason)
    throw new AppError("Informe o motivo do cancelamento.");

  const cancelled = await cancelPurchaseOrderById(id, {
    reason: cancellationReason,
    cancelledAt: new Date(),
    cancelledBy: "João Lobo",
  });

  await registerAudit({
    entityType: "PURCHASE_ORDER",
    entityId: cancelled._id,
    action: "CANCEL",
    description: `Pedido ${cancelled.orderNumber} cancelado.`,
    metadata: { reason: cancellationReason },
  });

  return cancelled;
}
