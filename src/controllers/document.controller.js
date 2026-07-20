import {
  addDivergenceComment,
  approveDocument,
  createDocument,
  getDocumentById,
  integrateDocumentWithErp,
  listDocuments,
  rejectDocument,
  removeDocument,
  resolveDivergence,
  updateDocument,
  validateAndRouteDocument,
} from "../services/document.service.js";
import { listActiveDocumentTypes } from "../services/document-type.service.js";
import { listAvailablePurchaseOrders } from "../services/purchase-order.service.js";
import { listActiveSuppliers } from "../services/supplier.service.js";
import { redirectWithMessage } from "../utils/http.js";

function toDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function documentToFormData(document) {
  return {
    ...document,
    _id: document._id.toString(),
    typeId: document.typeId.toString(),
    supplierId: document.supplierId.toString(),
    purchaseOrderId: document.purchaseOrderId?.toString() || "",
    issueDate: toDateInput(document.issueDate),
    expirationDate: toDateInput(document.expirationDate),
    metadataJson: JSON.stringify(document.metadata || {}),
  };
}

async function getFormDependencies() {
  const [documentTypes, suppliers, purchaseOrders] = await Promise.all([
    listActiveDocumentTypes(),
    listActiveSuppliers(),
    listAvailablePurchaseOrders(),
  ]);
  return { documentTypes, suppliers, purchaseOrders };
}

export async function showDocumentsPage(request, response, next) {
  try {
    const filters = {
      search: request.query.search?.trim() || "",
      status: request.query.status || "",
      typeId: request.query.typeId || "",
      supplierId: request.query.supplierId || "",
      expiration: request.query.expiration || "",
    };
    const [documents, documentTypes, suppliers] = await Promise.all([
      listDocuments(filters),
      listActiveDocumentTypes(),
      listActiveSuppliers(),
    ]);
    return response.render("documents/index", {
      title: "Documentos",
      documents,
      documentTypes,
      suppliers,
      filters,
    });
  } catch (error) {
    return next(error);
  }
}

export async function showCreateDocumentPage(request, response, next) {
  try {
    return response.render("documents/new", {
      title: "Receber documento",
      ...(await getFormDependencies()),
      errorMessage: null,
      formData: { source: "SUPPLIER_PORTAL", metadataJson: "{}" },
    });
  } catch (error) {
    return next(error);
  }
}

export async function storeDocument(request, response, next) {
  try {
    const document = await createDocument(request.body);
    return redirectWithMessage(
      response,
      `/documents/${document._id}`,
      "Documento cadastrado com sucesso.",
    );
  } catch (error) {
    try {
      return response.status(400).render("documents/new", {
        title: "Receber documento",
        ...(await getFormDependencies()),
        errorMessage: error.message,
        formData: request.body,
      });
    } catch (renderError) {
      return next(renderError);
    }
  }
}

export async function showDocumentDetailsPage(request, response, next) {
  try {
    const document = await getDocumentById(request.params.id);
    return response.render("documents/show", {
      title: document.documentNumber,
      document,
    });
  } catch (error) {
    return next(error);
  }
}

export async function showEditDocumentPage(request, response, next) {
  try {
    const document = await getDocumentById(request.params.id);
    return response.render("documents/edit", {
      title: "Editar documento",
      ...(await getFormDependencies()),
      errorMessage: null,
      formData: documentToFormData(document),
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateDocumentRecord(request, response, next) {
  try {
    const document = await updateDocument(request.params.id, request.body);
    return redirectWithMessage(
      response,
      `/documents/${document._id}`,
      "Documento atualizado com sucesso.",
    );
  } catch (error) {
    try {
      return response.status(400).render("documents/edit", {
        title: "Editar documento",
        ...(await getFormDependencies()),
        errorMessage: error.message,
        formData: { ...request.body, _id: request.params.id },
      });
    } catch (renderError) {
      return next(renderError);
    }
  }
}

export async function revalidateDocumentRecord(request, response) {
  try {
    await validateAndRouteDocument(request.params.id);
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      "Documento revalidado com sucesso.",
    );
  } catch (error) {
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      error.message,
      "error",
    );
  }
}

export async function addDivergenceCommentRecord(request, response) {
  try {
    await addDivergenceComment(
      request.params.id,
      request.params.divergenceId,
      request.body.comment,
    );
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      "Comentário adicionado.",
    );
  } catch (error) {
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      error.message,
      "error",
    );
  }
}

export async function resolveDivergenceRecord(request, response) {
  try {
    await resolveDivergence(
      request.params.id,
      request.params.divergenceId,
      request.body.resolutionNote,
    );
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      "Divergência marcada como resolvida.",
    );
  } catch (error) {
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      error.message,
      "error",
    );
  }
}

export async function approveDocumentRecord(request, response) {
  try {
    await approveDocument(request.params.id, request.body.note);
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      "Etapa aprovada com sucesso.",
    );
  } catch (error) {
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      error.message,
      "error",
    );
  }
}

export async function rejectDocumentRecord(request, response) {
  try {
    await rejectDocument(request.params.id, request.body.note);
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      "Documento rejeitado.",
    );
  } catch (error) {
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      error.message,
      "error",
    );
  }
}

export async function integrateDocumentRecord(request, response) {
  try {
    await integrateDocumentWithErp(request.params.id);
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      "Escrituração simulada no ERP com sucesso.",
    );
  } catch (error) {
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      error.message,
      "error",
    );
  }
}

export async function deleteDocumentRecord(request, response) {
  try {
    await removeDocument(request.params.id);
    return redirectWithMessage(
      response,
      "/documents",
      "Documento excluído com sucesso.",
    );
  } catch (error) {
    return redirectWithMessage(
      response,
      `/documents/${request.params.id}`,
      error.message,
      "error",
    );
  }
}
