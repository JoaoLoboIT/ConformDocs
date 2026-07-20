import { getDatabase } from "../config/database.js";

const COLLECTION_NAME = "documentTypes";

export async function findAllDocumentTypes() {
    const database = getDatabase();

    return database
        .collection(COLLECTION_NAME)
        .find({})
        .sort({ name: 1 })
        .toArray();
}

export async function findDocumentTypeByCode(code) {
    const database = getDatabase();

    return database
        .collection(COLLECTION_NAME)
        .findOne({ code });
}

export async function insertDocumentType(documentType) {
    const database = getDatabase();

    const result = await database
        .collection(COLLECTION_NAME)
        .insertOne(documentType);

    return {
        ...documentType,
        _id: result.insertedId
    };
}