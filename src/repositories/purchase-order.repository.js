import { ObjectId } from "mongodb";
import { getDatabase } from "../config/database.js";
import { escapeRegex } from "../utils/normalizers.js";

const COLLECTION_NAME = "purchaseOrders";

export async function findAllPurchaseOrders(filters = {}) {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.supplierId && ObjectId.isValid(filters.supplierId)) {
    query.supplierId = new ObjectId(filters.supplierId);
  }
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), "i");
    query.$or = [
      { orderNumber: regex },
      { "supplierSnapshot.tradeName": regex },
      { costCenter: regex },
    ];
  }

  return getDatabase()
    .collection(COLLECTION_NAME)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function findAvailablePurchaseOrders() {
  return getDatabase()
    .collection(COLLECTION_NAME)
    .find({
      status: { $in: ["OPEN", "PARTIALLY_USED"] },
      remainingAmount: { $gt: 0 },
    })
    .sort({ issueDate: -1 })
    .toArray();
}

export async function findPurchaseOrderByNumber(orderNumber) {
  return getDatabase().collection(COLLECTION_NAME).findOne({ orderNumber });
}

export async function findPurchaseOrderById(id) {
  if (!ObjectId.isValid(id)) return null;
  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOne({ _id: new ObjectId(id) });
}

export async function insertPurchaseOrder(purchaseOrder) {
  const result = await getDatabase()
    .collection(COLLECTION_NAME)
    .insertOne(purchaseOrder);
  return { ...purchaseOrder, _id: result.insertedId };
}

export async function cancelPurchaseOrderById(id, cancellation) {
  if (!ObjectId.isValid(id)) return null;

  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOneAndUpdate(
      {
        _id: new ObjectId(id),
        status: { $in: ["OPEN", "PARTIALLY_USED"] },
      },
      {
        $set: {
          status: "CANCELLED",
          cancellation,
          updatedAt: cancellation.cancelledAt,
        },
        $push: {
          statusHistory: {
            status: "CANCELLED",
            changedAt: cancellation.cancelledAt,
            note: cancellation.reason,
          },
        },
      },
      { returnDocument: "after" },
    );
}

export async function consumePurchaseOrderAmount(
  id,
  amount,
  documentReference,
) {
  if (!ObjectId.isValid(id)) return null;

  const currentDate = new Date();
  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOneAndUpdate(
      {
        _id: new ObjectId(id),
        status: { $in: ["OPEN", "PARTIALLY_USED"] },
        remainingAmount: { $gte: amount },
      },
      [
        {
          $set: {
            remainingAmount: { $subtract: ["$remainingAmount", amount] },
            updatedAt: currentDate,
            linkedDocuments: {
              $concatArrays: [
                { $ifNull: ["$linkedDocuments", []] },
                [documentReference],
              ],
            },
          },
        },
        {
          $set: {
            status: {
              $cond: [
                { $lte: ["$remainingAmount", 0] },
                "CLOSED",
                "PARTIALLY_USED",
              ],
            },
          },
        },
        {
          $set: {
            statusHistory: {
              $concatArrays: [
                "$statusHistory",
                [
                  {
                    status: "$status",
                    changedAt: currentDate,
                    note: `Valor de ${amount} consumido pelo documento ${documentReference.documentNumber}.`,
                  },
                ],
              ],
            },
          },
        },
      ],
      { returnDocument: "after" },
    );
}
