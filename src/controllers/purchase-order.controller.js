import {
  cancelPurchaseOrder,
  createPurchaseOrder,
  getPurchaseOrderById,
  listPurchaseOrders,
} from "../services/purchase-order.service.js";
import { listActiveSuppliers } from "../services/supplier.service.js";
import { redirectWithMessage } from "../utils/http.js";

export async function showPurchaseOrdersPage(request, response, next) {
  try {
    const filters = {
      search: request.query.search?.trim() || "",
      status: request.query.status || "",
      supplierId: request.query.supplierId || "",
    };
    const [purchaseOrders, suppliers] = await Promise.all([
      listPurchaseOrders(filters),
      listActiveSuppliers(),
    ]);
    return response.render("purchase-orders/index", {
      title: "Pedidos de compra",
      purchaseOrders,
      suppliers,
      filters,
    });
  } catch (error) {
    return next(error);
  }
}

export async function showCreatePurchaseOrderPage(request, response, next) {
  try {
    const suppliers = await listActiveSuppliers();
    return response.render("purchase-orders/new", {
      title: "Cadastrar pedido de compra",
      suppliers,
      errorMessage: null,
      formData: {},
    });
  } catch (error) {
    return next(error);
  }
}

export async function storePurchaseOrder(request, response, next) {
  try {
    const purchaseOrder = await createPurchaseOrder(request.body);
    return redirectWithMessage(
      response,
      `/purchase-orders/${purchaseOrder._id}`,
      "Pedido de compra cadastrado com sucesso.",
    );
  } catch (error) {
    try {
      const suppliers = await listActiveSuppliers();
      return response.status(400).render("purchase-orders/new", {
        title: "Cadastrar pedido de compra",
        suppliers,
        errorMessage: error.message,
        formData: request.body,
      });
    } catch (renderError) {
      return next(renderError);
    }
  }
}

export async function showPurchaseOrderDetailsPage(request, response, next) {
  try {
    const purchaseOrder = await getPurchaseOrderById(request.params.id);
    return response.render("purchase-orders/show", {
      title: purchaseOrder.orderNumber,
      purchaseOrder,
    });
  } catch (error) {
    return next(error);
  }
}

export async function cancelPurchaseOrderRecord(request, response) {
  try {
    await cancelPurchaseOrder(request.params.id, request.body.reason);
    return redirectWithMessage(
      response,
      `/purchase-orders/${request.params.id}`,
      "Pedido cancelado com sucesso.",
    );
  } catch (error) {
    return redirectWithMessage(
      response,
      `/purchase-orders/${request.params.id}`,
      error.message,
      "error",
    );
  }
}
