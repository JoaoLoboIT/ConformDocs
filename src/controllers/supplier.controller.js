import {
    createSupplier,
    getSupplierById,
    listSuppliers,
    updateSupplier
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

export async function showSupplierDetailsPage(
    request,
    response,
    next
) {
    try {
        const supplier = await getSupplierById(
            request.params.id
        );

        return response.render("suppliers/show", {
            title: supplier.tradeName,
            supplier
        });
    } catch (error) {
        return next(error);
    }
}

export async function showEditSupplierPage(
    request,
    response,
    next
) {
    try {
        const supplier = await getSupplierById(
            request.params.id
        );

        return response.render("suppliers/edit", {
            title: "Editar fornecedor",
            errorMessage: null,
            formData: supplier
        });
    } catch (error) {
        return next(error);
    }
}

export async function updateSupplierRecord(
    request,
    response,
    next
) {
    try {
        const supplier = await updateSupplier(
            request.params.id,
            request.body
        );

        return response.redirect(
            `/suppliers/${supplier._id}`
        );
    } catch (error) {
        return response.status(400).render("suppliers/edit", {
            title: "Editar fornecedor",
            errorMessage: error.message,
            formData: {
                ...request.body,
                _id: request.params.id
            }
        });
    }
}