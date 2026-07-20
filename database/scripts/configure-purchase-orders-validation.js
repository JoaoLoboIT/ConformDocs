import { connectToDatabase } from "../../src/config/database.js";

async function configurePurchaseOrdersValidation() {
    try {
        const database = await connectToDatabase();

        await database.command({
            collMod: "purchaseOrders",
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: [
                        "orderNumber",
                        "supplierId",
                        "supplierSnapshot",
                        "issueDate",
                        "costCenter",
                        "description",
                        "totalAmount",
                        "remainingAmount",
                        "status",
                        "statusHistory",
                        "createdAt",
                        "updatedAt"
                    ],
                    properties: {
                        orderNumber: {
                            bsonType: "string",
                            minLength: 3
                        },
                        supplierId: {
                            bsonType: "objectId"
                        },
                        supplierSnapshot: {
                            bsonType: "object",
                            required: [
                                "tradeName",
                                "legalName",
                                "cnpj"
                            ],
                            properties: {
                                tradeName: {
                                    bsonType: "string"
                                },
                                legalName: {
                                    bsonType: "string"
                                },
                                cnpj: {
                                    bsonType: "string",
                                    pattern: "^[0-9]{14}$"
                                }
                            }
                        },
                        issueDate: {
                            bsonType: "date"
                        },
                        costCenter: {
                            bsonType: "string"
                        },
                        description: {
                            bsonType: "string"
                        },
                        totalAmount: {
                            bsonType: "double",
                            minimum: 0.01
                        },
                        remainingAmount: {
                            bsonType: "double",
                            minimum: 0
                        },
                        status: {
                            enum: [
                                "OPEN",
                                "PARTIALLY_USED",
                                "CLOSED",
                                "CANCELLED"
                            ]
                        },
                        statusHistory: {
                            bsonType: "array",
                            minItems: 1,
                            items: {
                                bsonType: "object",
                                required: ["status", "changedAt"],
                                properties: {
                                    status: {
                                        bsonType: "string"
                                    },
                                    changedAt: {
                                        bsonType: "date"
                                    }
                                }
                            }
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
            "Validação da coleção purchaseOrders configurada com sucesso."
        );

        process.exit(0);
    } catch (error) {
        console.error(
            "Erro ao configurar a validação de purchaseOrders:"
        );
        console.error(error);

        process.exit(1);
    }
}

configurePurchaseOrdersValidation();