import {
    createSupplier,
    listSuppliers
} from "../services/supplier.service.js";

export async function showSuppliersPage(request, response, next) {
    try {
        const suppliers = await listSuppliers();

        return response.render("suppliers/index", {
            title: "Fornecedores",
            suppliers
        });
    } catch (error) {
        return next(error);
    }
}

export function showCreateSupplierPage(request, response) {
    return response.render("suppliers/new", {
        title: "Cadastrar fornecedor",
        errorMessage: null,
        formData: {}
    });
}

export async function storeSupplier(request, response, next) {
    try {
        await createSupplier(request.body);

        return response.redirect("/suppliers");
    } catch (error) {
        return response.status(400).render("suppliers/new", {
            title: "Cadastrar fornecedor",
            errorMessage: error.message,
            formData: request.body
        });
    }
}