import {
    findAllDocumentTypes,
    findDocumentTypeByCode,
    insertDocumentType
} from "../repositories/document-type.repository.js";

export async function listDocumentTypes() {
    return findAllDocumentTypes();
}

export async function createDocumentType(data) {
    const name = data.name?.trim();

    const code = data.code
        ?.trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_]/g, "_");

    const description = data.description?.trim();
    const category = data.category;

    if (!name || !code || !description || !category) {
        throw new Error("Todos os campos obrigatórios devem ser preenchidos.");
    }

    if (!["FISCAL", "NON_FISCAL"].includes(category)) {
        throw new Error("A categoria informada é inválida.");
    }

    const existingDocumentType =
        await findDocumentTypeByCode(code);

    if (existingDocumentType) {
        throw new Error(
            "Já existe um tipo de documento com este código."
        );
    }

    const currentDate = new Date();

    return insertDocumentType({
        name,
        code,
        description,
        category,
        hasExpiration: data.hasExpiration === "on",
        requiresPurchaseOrder:
            data.requiresPurchaseOrder === "on",

        customFields: [],
        validationRules: [],

        status: "ACTIVE",
        createdAt: currentDate,
        updatedAt: currentDate
    });
}