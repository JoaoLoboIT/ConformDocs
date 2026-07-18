import {
    findAllSuppliers,
    findSupplierByCnpj,
    findSupplierById,
    insertSupplier
} from "../repositories/supplier.repository.js";

export async function listSuppliers() {
    return findAllSuppliers();
}

export async function createSupplier(data) {
    const supplier = {
        legalName: data.legalName?.trim(),
        tradeName: data.tradeName?.trim(),
        cnpj: data.cnpj?.replace(/\D/g, ""),
        email: data.email?.trim().toLowerCase(),
        phone: data.phone?.replace(/\D/g, "")
    };

    const hasEmptyField = Object.values(supplier).some(
        (value) => !value
    );

    if (hasEmptyField) {
        throw new Error("Todos os campos são obrigatórios.");
    }

    if (supplier.cnpj.length !== 14) {
        throw new Error("O CNPJ deve possuir 14 números.");
    }

    const existingSupplier = await findSupplierByCnpj(
        supplier.cnpj
    );

    if (existingSupplier) {
        throw new Error(
            "Já existe um fornecedor cadastrado com este CNPJ."
        );
    }

    const currentDate = new Date();

    return insertSupplier({
        ...supplier,
        status: "ACTIVE",
        createdAt: currentDate,
        updatedAt: currentDate
    });
}

export async function getSupplierById(id) {
    const supplier = await findSupplierById(id);

    if (!supplier) {
        throw new Error("Fornecedor não encontrado.");
    }

    return supplier;
}