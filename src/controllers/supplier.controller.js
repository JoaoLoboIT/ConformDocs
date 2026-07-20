import {
  createSupplier,
  getSupplierById,
  listSuppliers,
  updateSupplier,
} from "../services/supplier.service.js";
import { redirectWithMessage } from "../utils/http.js";

export async function showSuppliersPage(request, response, next) {
  try {
    const filters = {
      search: request.query.search?.trim() || "",
      status: request.query.status || "",
    };
    const suppliers = await listSuppliers(filters);
    return response.render("suppliers/index", {
      title: "Fornecedores",
      suppliers,
      filters,
    });
  } catch (error) {
    return next(error);
  }
}

export function showCreateSupplierPage(request, response) {
  return response.render("suppliers/new", {
    title: "Cadastrar fornecedor",
    errorMessage: null,
    formData: {},
  });
}

export async function storeSupplier(request, response) {
  try {
    const supplier = await createSupplier(request.body);
    return redirectWithMessage(
      response,
      `/suppliers/${supplier._id}`,
      "Fornecedor cadastrado com sucesso.",
    );
  } catch (error) {
    return response.status(400).render("suppliers/new", {
      title: "Cadastrar fornecedor",
      errorMessage: error.message,
      formData: request.body,
    });
  }
}

export async function showSupplierDetailsPage(request, response, next) {
  try {
    const supplier = await getSupplierById(request.params.id);
    return response.render("suppliers/show", {
      title: supplier.tradeName,
      supplier,
    });
  } catch (error) {
    return next(error);
  }
}

export async function showEditSupplierPage(request, response, next) {
  try {
    const supplier = await getSupplierById(request.params.id);
    return response.render("suppliers/edit", {
      title: "Editar fornecedor",
      errorMessage: null,
      formData: supplier,
    });
  } catch (error) {
    return next(error);
  }
}

export async function updateSupplierRecord(request, response) {
  try {
    const supplier = await updateSupplier(request.params.id, request.body);
    return redirectWithMessage(
      response,
      `/suppliers/${supplier._id}`,
      "Fornecedor atualizado com sucesso.",
    );
  } catch (error) {
    return response.status(400).render("suppliers/edit", {
      title: "Editar fornecedor",
      errorMessage: error.message,
      formData: { ...request.body, _id: request.params.id },
    });
  }
}
