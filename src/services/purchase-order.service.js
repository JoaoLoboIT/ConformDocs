import {
    findAllPurchaseOrders,
    findPurchaseOrderByNumber,
    insertPurchaseOrder
} from "../repositories/purchase-order.repository.js";

import { getSupplierById } from "./supplier.service.js";

export async function listPurchaseOrders() {
    return findAllPurchaseOrders();
}

export async function createPurchaseOrder(data) {
    const orderNumber = data.orderNumber?.trim().toUpperCase();
    const supplierId = data.supplierId;
    const costCenter = data.costCenter?.trim();
    const description = data.description?.trim();
    const totalAmount = Number(data.totalAmount);
    const issueDate = new Date(data.issueDate);

    if (
        !orderNumber ||
        !supplierId ||
        !costCenter ||
        !description ||
        !data.issueDate
    ) {
        throw new Error("Todos os campos são obrigatórios.");
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        throw new Error("O valor total deve ser maior que zero.");
    }

    if (Number.isNaN(issueDate.getTime())) {
        throw new Error("A data de emissão é inválida.");
    }

    const existingPurchaseOrder =
        await findPurchaseOrderByNumber(orderNumber);

    if (existingPurchaseOrder) {
        throw new Error(
            "Já existe um pedido com este número."
        );
    }

    const supplier = await getSupplierById(supplierId);

    if (supplier.status !== "ACTIVE") {
        throw new Error(
            "O fornecedor selecionado está inativo."
        );
    }

    const currentDate = new Date();

    return insertPurchaseOrder({
        orderNumber,

        supplierId: supplier._id,

        supplierSnapshot: {
            tradeName: supplier.tradeName,
            legalName: supplier.legalName,
            cnpj: supplier.cnpj
        },

        issueDate,
        costCenter,
        description,
        totalAmount,
        remainingAmount: totalAmount,
        status: "OPEN",

        statusHistory: [
            {
                status: "OPEN",
                changedAt: currentDate
            }
        ],

        createdAt: currentDate,
        updatedAt: currentDate
    });
}