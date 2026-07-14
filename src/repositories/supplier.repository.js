import { getDatabase } from "../config/database.js";

const COLLECTION_NAME = "suppliers";

export async function findAllSuppliers() {
    const database = getDatabase();

    return database
        .collection(COLLECTION_NAME)
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
}

export async function insertSupplier(supplier) {
    const database = getDatabase();

    const result = await database
        .collection(COLLECTION_NAME)
        .insertOne(supplier);

    return {
        ...supplier,
        _id: result.insertedId
    };
}

export async function findSupplierByCnpj(cnpj) {
    const database = getDatabase();

    return database
        .collection(COLLECTION_NAME)
        .findOne({ cnpj });
}