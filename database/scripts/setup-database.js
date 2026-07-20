import { connectToDatabase } from "../../src/config/database.js";
import { collectionDefinitions } from "../config/collection-definitions.js";
import { createIndexes } from "./create-indexes.js";

async function setupDatabase() {
  try {
    const database = await connectToDatabase();
    const existingCollections = new Set(
      (await database.listCollections({}, { nameOnly: true }).toArray()).map(
        (collection) => collection.name,
      ),
    );

    for (const [collectionName, schema] of Object.entries(
      collectionDefinitions,
    )) {
      const validator = { $jsonSchema: { bsonType: "object", ...schema } };
      if (existingCollections.has(collectionName)) {
        await database.command({
          collMod: collectionName,
          validator,
          validationLevel: "strict",
          validationAction: "error",
        });
      } else {
        await database.createCollection(collectionName, {
          validator,
          validationLevel: "strict",
          validationAction: "error",
        });
      }
      console.log(`Coleção ${collectionName} configurada.`);
    }

    await createIndexes(database);
    console.log("Banco ConformDocs configurado com sucesso.");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao configurar o banco:");
    console.error(error);
    process.exit(1);
  }
}

setupDatabase();
