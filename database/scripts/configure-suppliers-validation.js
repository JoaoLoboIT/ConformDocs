import { connectToDatabase } from "../../src/config/database.js";

async function configureSuppliersValidation() {
    try {
        const database = await connectToDatabase();

        await database.command({
            collMod: "suppliers",
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: [
                        "legalName",
                        "tradeName",
                        "cnpj",
                        "email",
                        "phone",
                        "status",
                        "createdAt",
                        "updatedAt"
                    ],
                    properties: {
                        legalName: {
                            bsonType: "string",
                            minLength: 2
                        },
                        tradeName: {
                            bsonType: "string",
                            minLength: 2
                        },
                        cnpj: {
                            bsonType: "string",
                            pattern: "^[0-9]{14}$"
                        },
                        email: {
                            bsonType: "string",
                            pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
                        },
                        phone: {
                            bsonType: "string",
                            pattern: "^[0-9]{10,11}$"
                        },
                        status: {
                            enum: ["ACTIVE", "INACTIVE"]
                        },
                        createdAt: {
                            bsonType: "date"
                        },
                        updatedAt: {
                            bsonType: "date"
                        }
                    }
                }
            },
            validationLevel: "strict",
            validationAction: "error"
        });

        console.log(
            "Validação da coleção suppliers configurada com sucesso."
        );

        process.exit(0);
    } catch (error) {
        console.error(
            "Erro ao configurar a validação da coleção suppliers:"
        );
        console.error(error);

        process.exit(1);
    }
}

configureSuppliersValidation();