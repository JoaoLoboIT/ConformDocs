import { getDatabase } from "../config/database.js";

const COLLECTION_NAME = "purchaseOrders";

export async function findAllPurchaseOrders() {
    const database = getDatabase();

    return database
        .collection(COLLECTION_NAME)
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
}

export async function insertPurchaseOrder(purchaseOrder) {
    const database = getDatabase();

    const result = await database
        .collection(COLLECTION_NAME)
        .insertOne(purchaseOrder);

    return {
        ...purchaseOrder,
        _id: result.insertedId
    };
}

export async function findPurchaseOrderByNumber(orderNumber) {
    const database = getDatabase();

    return database
        .collection(COLLECTION_NAME)
        .findOne({ orderNumber });
}