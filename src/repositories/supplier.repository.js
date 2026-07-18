import { getDatabase } from "../config/database.js";
import { ObjectId } from "mongodb";

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

export async function findSupplierById(id) {
    const database = getDatabase();

    if (!ObjectId.isValid(id)) {
        return null;
    }

    return database
        .collection(COLLECTION_NAME)
        .findOne({
            _id: new ObjectId(id)
        });
}

export async function updateSupplierById(id, supplierData) {
    const database = getDatabase();

    if (!ObjectId.isValid(id)) {
        return null;
    }

    const result = await database
        .collection(COLLECTION_NAME)
        .findOneAndUpdate(
            {
                _id: new ObjectId(id)
            },
            {
                $set: supplierData
            },
            {
                returnDocument: "after"
            }
        );

    return result;
}