import {
  createDocumentType,
  listDocumentTypes,
} from "../services/document-type.service.js";

export async function showDocumentTypesPage(request, response, next) {
  try {
    const documentTypes = await listDocumentTypes();

    return response.render("document-types/index", {
      title: "Tipos de documento",
      documentTypes,
    });
  } catch (error) {
    return next(error);
  }
}

export function showCreateDocumentTypePage(
    request,
    response
) {
    return response.render("document-types/new", {
        title: "Cadastrar tipo de documento",
        errorMessage: null,
        formData: {}
    });
}

export async function storeDocumentType(
    request,
    response
) {
    try {
        await createDocumentType(request.body);

        return response.redirect("/document-types");
    } catch (error) {
        return response.status(400).render(
            "document-types/new",
            {
                title: "Cadastrar tipo de documento",
                errorMessage: error.message,
                formData: request.body
            }
        );
    }
}