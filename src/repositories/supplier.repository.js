import { ObjectId } from "mongodb";
import { getDatabase } from "../config/database.js";
import { escapeRegex } from "../utils/normalizers.js";

const COLLECTION_NAME = "suppliers";

export async function findAllSuppliers(filters = {}) {
  const database = getDatabase();
  const query = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.search) {
    const regex = new RegExp(escapeRegex(filters.search), "i");
    query.$or = [
      { legalName: regex },
      { tradeName: regex },
      { cnpj: regex },
      { email: regex },
    ];
  }

  return database
    .collection(COLLECTION_NAME)
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function countSuppliers(query = {}) {
  return getDatabase().collection(COLLECTION_NAME).countDocuments(query);
}

export async function findActiveSuppliers() {
  return getDatabase()
    .collection(COLLECTION_NAME)
    .find({ status: "ACTIVE" })
    .sort({ tradeName: 1 })
    .toArray();
}

export async function findSupplierByCnpj(cnpj) {
  return getDatabase().collection(COLLECTION_NAME).findOne({ cnpj });
}

export async function findSupplierById(id) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOne({ _id: new ObjectId(id) });
}

export async function insertSupplier(supplier) {
  const result = await getDatabase()
    .collection(COLLECTION_NAME)
    .insertOne(supplier);
  return { ...supplier, _id: result.insertedId };
}

export async function updateSupplierById(id, supplierData) {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  return getDatabase()
    .collection(COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: supplierData },
      { returnDocument: "after" },
    );
}
