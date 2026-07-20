import { ObjectId } from "mongodb";
import { getDatabase } from "../config/database.js";
import { escapeRegex } from "../utils/normalizers.js";

const COLLECTION_NAME = "documentTypes";

export async function findAllDocumentTypes(filters = {}) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.category) query.category = filters.category;
  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), "i");
    query.$or = [{ name: regex }, { code: regex }, { description: regex }];
  }

  return getDatabase()
    .collection(COLLECTION_NAME)
    .find(query)
    .sort({ name: 1 })
    .toArray();
}

export async function findActiveDocumentTypes() {
  return getDatabase()
    .collection(COLLECTION_NAME)
    .find({ status: "ACTIVE" })
    .sort({ name: 1 })
    .toArray();
}

export async function findDocumentTypeByCode(code) {
  return getDatabase().collection(COLLECTION_NAME).findOne({ code });
}

export async function findDocumentTypeById(id) {
  if (!ObjectId.isValid(id)) return null;
  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOne({ _id: new ObjectId(id) });
}

export async function insertDocumentType(documentType) {
  const result = await getDatabase()
    .collection(COLLECTION_NAME)
    .insertOne(documentType);
  return { ...documentType, _id: result.insertedId };
}

export async function updateDocumentTypeById(id, documentTypeData) {
  if (!ObjectId.isValid(id)) return null;
  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: documentTypeData },
      { returnDocument: "after" },
    );
}
