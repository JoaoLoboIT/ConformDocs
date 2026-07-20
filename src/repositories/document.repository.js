import { ObjectId } from "mongodb";
import { getDatabase } from "../config/database.js";
import { escapeRegex } from "../utils/normalizers.js";

const COLLECTION_NAME = "documents";

function buildFilter(filters = {}) {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.typeId && ObjectId.isValid(filters.typeId))
    query.typeId = new ObjectId(filters.typeId);
  if (filters.supplierId && ObjectId.isValid(filters.supplierId)) {
    query.supplierId = new ObjectId(filters.supplierId);
  }
  if (filters.expiration === "expired") {
    query.expirationDate = { $lt: new Date() };
  }
  if (filters.expiration === "next30") {
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    query.expirationDate = { $gte: new Date(), $lte: limit };
  }
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), "i");
    query.$or = [
      { documentNumber: regex },
      { "supplierSnapshot.tradeName": regex },
      { "typeSnapshot.name": regex },
    ];
  }

  return query;
}

export async function findAllDocuments(filters = {}) {
  return getDatabase()
    .collection(COLLECTION_NAME)
    .find(buildFilter(filters))
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();
}

export async function findRecentDocuments(limit = 6) {
  return getDatabase()
    .collection(COLLECTION_NAME)
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function findDocumentById(id) {
  if (!ObjectId.isValid(id)) return null;
  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOne({ _id: new ObjectId(id) });
}

export async function findDuplicateDocument({
  documentNumber,
  supplierId,
  typeId,
  excludeId,
}) {
  const query = {
    documentNumber,
    supplierId: new ObjectId(supplierId),
    typeId: new ObjectId(typeId),
  };

  if (excludeId && ObjectId.isValid(excludeId)) {
    query._id = { $ne: new ObjectId(excludeId) };
  }

  return getDatabase().collection(COLLECTION_NAME).findOne(query);
}

export async function insertDocument(document) {
  const result = await getDatabase()
    .collection(COLLECTION_NAME)
    .insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function updateDocumentById(id, data) {
  if (!ObjectId.isValid(id)) return null;
  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: "after" },
    );
}

export async function deleteDocumentById(id) {
  if (!ObjectId.isValid(id)) return false;
  const result = await getDatabase()
    .collection(COLLECTION_NAME)
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function countDocumentsByTypeId(typeId) {
  if (!ObjectId.isValid(typeId)) return 0;
  return getDatabase()
    .collection(COLLECTION_NAME)
    .countDocuments({ typeId: new ObjectId(typeId) });
}
