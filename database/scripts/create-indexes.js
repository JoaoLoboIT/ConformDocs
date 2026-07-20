import { connectToDatabase } from "../../src/config/database.js";

async function createIndexes() {
  try {
    const database = await connectToDatabase();

    await database.collection("suppliers").createIndex(
      { cnpj: 1 },
      {
        unique: true,
        name: "unique_supplier_cnpj",
      },
    );

    await database.collection("purchaseOrders").createIndex(
      { orderNumber: 1 },
      {
        unique: true,
        name: "unique_purchase_order_number",
      },
    );

    console.log("Índices criados com sucesso.");

    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar índices:");
    console.error(error);

    process.exit(1);
  }
}

createIndexes();
