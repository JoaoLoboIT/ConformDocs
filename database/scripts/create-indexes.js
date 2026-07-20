import { pathToFileURL } from "node:url";
import { connectToDatabase } from "../../src/config/database.js";

export async function createIndexes(database) {
  await Promise.all([
    database
      .collection("suppliers")
      .createIndex({ cnpj: 1 }, { unique: true, name: "unique_supplier_cnpj" }),
    database
      .collection("suppliers")
      .createIndex(
        { status: 1, tradeName: 1 },
        { name: "supplier_status_name" },
      ),
    database
      .collection("purchaseOrders")
      .createIndex(
        { orderNumber: 1 },
        { unique: true, name: "unique_purchase_order_number" },
      ),
    database
      .collection("purchaseOrders")
      .createIndex(
        { supplierId: 1, status: 1 },
        { name: "purchase_order_supplier_status" },
      ),
    database
      .collection("documentTypes")
      .createIndex(
        { code: 1 },
        { unique: true, name: "unique_document_type_code" },
      ),
    database
      .collection("documentTypes")
      .createIndex(
        { status: 1, name: 1 },
        { name: "document_type_status_name" },
      ),
    database
      .collection("documents")
      .createIndex(
        { documentNumber: 1, supplierId: 1, typeId: 1 },
        { name: "document_number_supplier_type" },
      ),
    database
      .collection("documents")
      .createIndex(
        { status: 1, createdAt: -1 },
        { name: "document_status_created_at" },
      ),
    database
      .collection("documents")
      .createIndex({ expirationDate: 1 }, { name: "document_expiration" }),
    database
      .collection("documents")
      .createIndex(
        { supplierId: 1, typeId: 1 },
        { name: "document_supplier_type" },
      ),
    database
      .collection("auditLogs")
      .createIndex({ occurredAt: -1 }, { name: "audit_occurred_at" }),
    database
      .collection("auditLogs")
      .createIndex({ entityType: 1, entityId: 1 }, { name: "audit_entity" }),
  ]);
}

async function run() {
  try {
    const database = await connectToDatabase();
    await createIndexes(database);
    console.log("Índices criados com sucesso.");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar índices:");
    console.error(error);
    process.exit(1);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run();
}
