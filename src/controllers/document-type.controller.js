import {
  createDocumentType,
  getDocumentTypeById,
  getValidationRuleCatalog,
  listDocumentTypes,
  updateDocumentType,
} from "../services/document-type.service.js";
import { redirectWithMessage } from "../utils/http.js";

function renderForm(response, view, options) {
  return response.render(view, {
    validationRuleCatalog: getValidationRuleCatalog(),
    ...options,
  });
}

export async function showDocumentTypesPage(request, response, next) {
  try {
    const filters = {
      search: request.query.search?.trim() || "",
      status: request.query.status || "",
      category: request.query.category || "",
    };
    const documentTypes = await listDocumentTypes(filters);
    return response.render("document-types/index", {
      title: "Tipos de documento",
      documentTypes,
      filters,
    });
  } catch (error) {
    return next(error);
  }
}

export function showCreateDocumentTypePage(request, response) {
  return renderForm(response, "document-types/new", {
    title: "Cadastrar tipo de documento",
    errorMessage: null,
    formData: {},
  });
}

export async function storeDocumentType(request, response) {
  try {
    const documentType = await createDocumentType(request.body);
    return redirectWithMessage(
      response,
      "/document-types",
      `Tipo ${documentType.name} cadastrado com sucesso.`,
    );
  } catch (error) {
    response.status(400);
    return renderForm(response, "document-types/new", {
      title: "Cadastrar tipo de documento",
      errorMessage: error.message,
      formData: request.body,
    });
  }
}

export async function showEditDocumentTypePage(request, response, next) {
  try {
    const documentType = await getDocumentTypeById(request.params.id);
    return renderForm(response, "document-types/edit", {
      title: "Editar tipo de documento",
      errorMessage: null,
      formData: documentType,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateDocumentTypeRecord(request, response) {
  try {
    const documentType = await updateDocumentType(
      request.params.id,
      request.body,
    );
    return redirectWithMessage(
      response,
      "/document-types",
      `Tipo ${documentType.name} atualizado com sucesso.`,
    );
  } catch (error) {
    response.status(400);
    return renderForm(response, "document-types/edit", {
      title: "Editar tipo de documento",
      errorMessage: error.message,
      formData: { ...request.body, _id: request.params.id },
    });
  }
}
