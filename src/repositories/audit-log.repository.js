import { getDatabase } from "../config/database.js";

const COLLECTION_NAME = "auditLogs";

export async function insertAuditLog(log) {
  const result = await getDatabase().collection(COLLECTION_NAME).insertOne(log);
  return { ...log, _id: result.insertedId };
}

export async function findRecentAuditLogs(limit = 8) {
  return getDatabase()
    .collection(COLLECTION_NAME)
    .find({})
    .sort({ occurredAt: -1 })
    .limit(limit)
    .toArray();
}
