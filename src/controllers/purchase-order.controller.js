import {
    createPurchaseOrder,
    listPurchaseOrders
} from "../services/purchase-order.service.js";

import {
    listActiveSuppliers
} from "../services/supplier.service.js";

export async function showPurchaseOrdersPage(
    request,
    response,
    next
) {
    try {
        const purchaseOrders = await listPurchaseOrders();

        return response.render("purchase-orders/index", {
            title: "Pedidos de compra",
            purchaseOrders
        });
    } catch (error) {
        return next(error);
    }
}

export async function showCreatePurchaseOrderPage(
    request,
    response,
    next
) {
    try {
        const suppliers = await listActiveSuppliers();

        return response.render("purchase-orders/new", {
            title: "Cadastrar pedido de compra",
            suppliers,
            errorMessage: null,
            formData: {}
        });
    } catch (error) {
        return next(error);
    }
}

export async function storePurchaseOrder(
    request,
    response,
    next
) {
    try {
        await createPurchaseOrder(request.body);

        return response.redirect("/purchase-orders");
    } catch (error) {
        try {
            const suppliers = await listActiveSuppliers();

            return response.status(400).render(
                "purchase-orders/new",
                {
                    title: "Cadastrar pedido de compra",
                    suppliers,
                    errorMessage: error.message,
                    formData: request.body
                }
            );
        } catch (renderError) {
            return next(renderError);
        }
    }
}