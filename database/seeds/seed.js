import { connectToDatabase } from "../../src/config/database.js";
import { VALIDATION_RULE_CATALOG } from "../../src/config/domain.js";
import { buildDefaultWorkflowTemplate } from "../../src/services/workflow.service.js";

function rules(codes) {
  return codes.map((code) => ({
    ...VALIDATION_RULE_CATALOG[code],
    enabled: true,
  }));
}

const now = new Date();
const types = [
  {
    name: "Nota Fiscal Eletrônica",
    code: "NFE",
    description:
      "Documento fiscal de mercadorias vinculado a pedido de compra.",
    category: "FISCAL",
    hasExpiration: false,
    requiresPurchaseOrder: true,
    customFields: [
      {
        key: "series",
        label: "Série",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "accessKey",
        label: "Chave de acesso",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "supplierCnpj",
        label: "CNPJ informado na nota",
        type: "text",
        required: true,
        options: [],
      },
    ],
    validationRules: rules([
      "REQUIRED_FIELDS",
      "DUPLICATE_DOCUMENT",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
      "SUPPLIER_CNPJ_MATCH",
      "PURCHASE_ORDER_EXISTS",
      "PURCHASE_ORDER_SUPPLIER_MATCH",
      "PURCHASE_ORDER_AMOUNT",
    ]),
  },
  {
    name: "Certidão de Regularidade",
    code: "TAX_CLEARANCE",
    description:
      "Certidão não fiscal usada para acompanhar a regularidade do fornecedor.",
    category: "NON_FISCAL",
    hasExpiration: true,
    requiresPurchaseOrder: false,
    customFields: [
      {
        key: "issuingAuthority",
        label: "Órgão emissor",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "authenticationCode",
        label: "Código de autenticação",
        type: "text",
        required: true,
        options: [],
      },
    ],
    validationRules: rules([
      "REQUIRED_FIELDS",
      "DUPLICATE_DOCUMENT",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
      "DOCUMENT_NOT_EXPIRED",
    ]),
  },
  {
    name: "Contrato de Fornecimento",
    code: "SUPPLY_CONTRACT",
    description: "Contrato comercial com vigência e informações específicas.",
    category: "NON_FISCAL",
    hasExpiration: true,
    requiresPurchaseOrder: false,
    customFields: [
      {
        key: "contractOwner",
        label: "Responsável pelo contrato",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "contractScope",
        label: "Objeto do contrato",
        type: "textarea",
        required: true,
        options: [],
      },
    ],
    validationRules: rules([
      "REQUIRED_FIELDS",
      "DUPLICATE_DOCUMENT",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
      "DOCUMENT_NOT_EXPIRED",
    ]),
  },
].map((type) => ({
  ...type,
  workflowTemplate: buildDefaultWorkflowTemplate(type),
  status: "ACTIVE",
  createdAt: now,
  updatedAt: now,
}));

async function seed() {
  try {
    const database = await connectToDatabase();
    for (const type of types) {
      await database
        .collection("documentTypes")
        .updateOne(
          { code: type.code },
          { $setOnInsert: type },
          { upsert: true },
        );
    }

    let supplier = await database
      .collection("suppliers")
      .findOne({ cnpj: "12345678000195" });
    if (!supplier) {
      const result = await database.collection("suppliers").insertOne({
        legalName: "Alpha Tecnologia Ltda",
        tradeName: "Alpha Tech",
        cnpj: "12345678000195",
        email: "contato@alphatech.com",
        phone: "31999999999",
        contactName: "Marina Costa",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      });
      supplier = await database
        .collection("suppliers")
        .findOne({ _id: result.insertedId });
    }

    await database.collection("purchaseOrders").updateOne(
      { orderNumber: "PC-2026-001" },
      {
        $setOnInsert: {
          orderNumber: "PC-2026-001",
          supplierId: supplier._id,
          supplierSnapshot: {
            tradeName: supplier.tradeName,
            legalName: supplier.legalName,
            cnpj: supplier.cnpj,
          },
          issueDate: now,
          costCenter: "Tecnologia",
          description:
            "Aquisição de notebooks para a equipe de desenvolvimento.",
          totalAmount: 15000,
          remainingAmount: 15000,
          status: "OPEN",
          linkedDocuments: [],
          statusHistory: [
            {
              status: "OPEN",
              changedAt: now,
              note: "Pedido criado pelo seed.",
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );

    console.log("Dados de demonstração inseridos com sucesso.");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao inserir dados de demonstração:");
    console.error(error);
    process.exit(1);
  }
}

seed();
