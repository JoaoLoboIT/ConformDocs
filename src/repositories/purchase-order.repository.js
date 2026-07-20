import { getDatabase } from "../config/database.js";
import { ObjectId } from "mongodb";

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

export async function findPurchaseOrderById(id) {
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