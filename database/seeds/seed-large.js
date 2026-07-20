import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../src/config/database.js";
import {
  DEFAULT_VALIDATION_RULES,
  DOCUMENT_STATUS,
  VALIDATION_RESULT,
  VALIDATION_RULE_CATALOG,
} from "../../src/config/domain.js";
import {
  buildDefaultWorkflowTemplate,
  createWorkflowState,
} from "../../src/services/workflow.service.js";

const DEMO_TAG = "LARGE_DEMO_V1";
const SUPPLIER_COUNT = 30;
const PURCHASE_ORDER_COUNT = 60;
const DOCUMENT_COUNT = 160;

const now = new Date();
const actor = { name: "João Lobo", role: "Administrador" };

const companyPrefixes = [
  "Aurora",
  "Nexa",
  "Vertex",
  "Prime",
  "Orion",
  "Vértice",
  "Atlas",
  "Lumina",
  "Sigma",
  "Horizonte",
  "Integra",
  "Pulsar",
  "Nova",
  "Fortis",
  "Elo",
];

const companySectors = [
  "Tecnologia",
  "Logística",
  "Serviços",
  "Suprimentos",
  "Engenharia",
  "Consultoria",
  "Energia",
  "Soluções",
  "Distribuição",
  "Indústria",
];

const costCenters = [
  "Tecnologia",
  "Operações",
  "Financeiro",
  "Recursos Humanos",
  "Logística",
  "Marketing",
  "Facilities",
  "Jurídico",
];

const purchaseDescriptions = [
  "Aquisição de notebooks e periféricos para novas admissões.",
  "Contratação de serviços de suporte e manutenção preventiva.",
  "Compra de materiais para operação e estoque corporativo.",
  "Prestação de serviços de consultoria especializada.",
  "Fornecimento de equipamentos de infraestrutura e rede.",
  "Serviços recorrentes de logística e transporte.",
  "Renovação de licenças de software corporativo.",
  "Aquisição de mobiliário e itens para escritório.",
];

const sourceOptions = [
  "SUPPLIER_PORTAL",
  "EMAIL",
  "AUTOMATIC_CAPTURE",
  "MANUAL",
];

const statusSequence = [
  "DRAFT",
  "DRAFT",
  "DRAFT",
  "RECEIVED",
  "RECEIVED",
  "VALIDATING",
  "WITH_DIVERGENCE",
  "WITH_DIVERGENCE",
  "WITH_DIVERGENCE",
  "WITH_DIVERGENCE",
  "WITH_DIVERGENCE",
  "WITH_DIVERGENCE",
  "AWAITING_APPROVAL",
  "AWAITING_APPROVAL",
  "AWAITING_APPROVAL",
  "AWAITING_APPROVAL",
  "AWAITING_APPROVAL",
  "AWAITING_APPROVAL",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "APPROVED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "COMPLETED",
  "REJECTED",
  "REJECTED",
  "REJECTED",
];

function daysAgo(days) {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return date;
}

function daysFromNow(days) {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function ruleDefinitions(codes) {
  return codes.map((code) => ({
    ...VALIDATION_RULE_CATALOG[code],
    enabled: true,
  }));
}

const documentTypeDefinitions = [
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
    validationRules: ruleDefinitions([
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
    name: "Nota Fiscal de Serviço",
    code: "NFSE",
    description: "Documento fiscal de serviços vinculado a contrato ou pedido.",
    category: "FISCAL",
    hasExpiration: false,
    requiresPurchaseOrder: true,
    customFields: [
      {
        key: "serviceCode",
        label: "Código do serviço",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "municipality",
        label: "Município emissor",
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
    validationRules: ruleDefinitions([
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
    description: "Certidão usada para acompanhar a regularidade do fornecedor.",
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
    validationRules: ruleDefinitions([
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
    validationRules: ruleDefinitions([
      "REQUIRED_FIELDS",
      "DUPLICATE_DOCUMENT",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
      "DOCUMENT_NOT_EXPIRED",
    ]),
  },
  {
    name: "Comprovante Bancário",
    code: "BANK_PROOF",
    description:
      "Comprovante para validação dos dados bancários do fornecedor.",
    category: "NON_FISCAL",
    hasExpiration: false,
    requiresPurchaseOrder: false,
    customFields: [
      {
        key: "bank",
        label: "Banco",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "branch",
        label: "Agência",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "account",
        label: "Conta",
        type: "text",
        required: true,
        options: [],
      },
    ],
    validationRules: ruleDefinitions([
      "REQUIRED_FIELDS",
      "DUPLICATE_DOCUMENT",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
    ]),
  },
  {
    name: "Licença Ambiental",
    code: "ENVIRONMENTAL_LICENSE",
    description: "Licença ambiental com validade e órgão emissor.",
    category: "NON_FISCAL",
    hasExpiration: true,
    requiresPurchaseOrder: false,
    customFields: [
      {
        key: "environmentalAgency",
        label: "Órgão ambiental",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "licenseCategory",
        label: "Categoria da licença",
        type: "select",
        required: true,
        options: ["Operação", "Instalação", "Prévia"],
      },
    ],
    validationRules: ruleDefinitions([
      "REQUIRED_FIELDS",
      "DUPLICATE_DOCUMENT",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
      "DOCUMENT_NOT_EXPIRED",
    ]),
  },
  {
    name: "Apólice de Seguro",
    code: "INSURANCE_POLICY",
    description: "Apólice corporativa para controle de cobertura e vigência.",
    category: "NON_FISCAL",
    hasExpiration: true,
    requiresPurchaseOrder: false,
    customFields: [
      {
        key: "insuranceCompany",
        label: "Seguradora",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "coverage",
        label: "Cobertura",
        type: "text",
        required: true,
        options: [],
      },
    ],
    validationRules: ruleDefinitions([
      "REQUIRED_FIELDS",
      "DUPLICATE_DOCUMENT",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
      "DOCUMENT_NOT_EXPIRED",
    ]),
  },
  {
    name: "Comprovante de Entrega",
    code: "DELIVERY_RECEIPT",
    description: "Comprovante logístico de recebimento de materiais.",
    category: "NON_FISCAL",
    hasExpiration: false,
    requiresPurchaseOrder: false,
    customFields: [
      {
        key: "receivedBy",
        label: "Recebido por",
        type: "text",
        required: true,
        options: [],
      },
      {
        key: "deliveryLocation",
        label: "Local de entrega",
        type: "text",
        required: true,
        options: [],
      },
    ],
    validationRules: ruleDefinitions([
      "REQUIRED_FIELDS",
      "DUPLICATE_DOCUMENT",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
    ]),
  },
].map((type) => ({
  ...type,
  workflowTemplate: buildDefaultWorkflowTemplate(type),
  status: "ACTIVE",
  demoSeed: DEMO_TAG,
  createdAt: daysAgo(220),
  updatedAt: now,
}));

function buildSupplier(index) {
  const prefix = companyPrefixes[index % companyPrefixes.length];
  const sector = companySectors[(index * 3) % companySectors.length];
  const sequence = String(70000000000000 + index + 1);
  const tradeName = `${prefix} ${sector}`;
  const status = index % 5 === 4 ? "INACTIVE" : "ACTIVE";

  return {
    legalName: `${tradeName} Ltda`,
    tradeName,
    cnpj: sequence,
    email: `contato${String(index + 1).padStart(2, "0")}@demo-conformdocs.com`,
    phone: `31${String(980000000 + index).padStart(9, "0")}`,
    contactName: `Contato Demonstração ${index + 1}`,
    status,
    demoSeed: DEMO_TAG,
    demoIndex: index,
    createdAt: daysAgo(240 - index),
    updatedAt: now,
  };
}

function basePurchaseOrderStatus(index) {
  if (index % 12 === 11) return "CANCELLED";
  if (index % 12 === 10) return "CLOSED";
  if (index % 6 === 5) return "PARTIALLY_USED";
  return "OPEN";
}

function buildPurchaseOrder(index, supplier) {
  const status = basePurchaseOrderStatus(index);
  const totalAmount = 8000 + ((index * 7919) % 142000);
  const remainingAmount =
    status === "CLOSED" || status === "CANCELLED"
      ? 0
      : status === "PARTIALLY_USED"
        ? Math.round(totalAmount * 0.58 * 100) / 100
        : totalAmount;
  const createdAt = daysAgo(190 - (index % 170));

  const statusHistory = [
    {
      status: "OPEN",
      changedAt: createdAt,
      note: "Pedido de demonstração criado.",
    },
  ];

  if (status !== "OPEN") {
    statusHistory.push({
      status,
      changedAt: addHours(createdAt, 48),
      note:
        status === "CANCELLED"
          ? "Pedido cancelado para demonstrar indisponibilidade."
          : status === "CLOSED"
            ? "Pedido encerrado para demonstração."
            : "Pedido parcialmente consumido antes da carga demonstrativa.",
    });
  }

  return {
    orderNumber: `DEMO-PC-2026-${String(index + 1).padStart(3, "0")}`,
    supplierId: supplier._id,
    supplierSnapshot: {
      tradeName: supplier.tradeName,
      legalName: supplier.legalName,
      cnpj: supplier.cnpj,
    },
    issueDate: daysAgo(180 - (index % 160)),
    costCenter: costCenters[index % costCenters.length],
    description: purchaseDescriptions[index % purchaseDescriptions.length],
    totalAmount,
    remainingAmount,
    status,
    linkedDocuments: [],
    statusHistory,
    demoSeed: DEMO_TAG,
    demoIndex: index,
    createdAt,
    updatedAt: statusHistory.at(-1).changedAt,
  };
}

function buildTypeSnapshot(type) {
  return {
    name: type.name,
    code: type.code,
    category: type.category,
    hasExpiration: type.hasExpiration,
    requiresPurchaseOrder: type.requiresPurchaseOrder,
    customFields: type.customFields || [],
    validationRules: type.validationRules || [],
    workflowTemplate: type.workflowTemplate || [],
  };
}

function buildSupplierSnapshot(supplier) {
  return {
    tradeName: supplier.tradeName,
    legalName: supplier.legalName,
    cnpj: supplier.cnpj,
    email: supplier.email,
  };
}

function buildPurchaseOrderSnapshot(purchaseOrder) {
  if (!purchaseOrder) return null;
  return {
    orderNumber: purchaseOrder.orderNumber,
    costCenter: purchaseOrder.costCenter,
    totalAmount: purchaseOrder.totalAmount,
    remainingAmount: purchaseOrder.remainingAmount,
  };
}

function buildMetadata(type, supplier, index) {
  const metadata = {};

  for (const field of type.customFields || []) {
    if (field.key === "series") metadata[field.key] = String((index % 9) + 1);
    else if (field.key === "accessKey")
      metadata[field.key] =
        `${supplier.cnpj}${String(index).padStart(30, "0")}`.slice(0, 44);
    else if (field.key === "supplierCnpj") metadata[field.key] = supplier.cnpj;
    else if (field.key === "serviceCode")
      metadata[field.key] = `SERV-${100 + (index % 50)}`;
    else if (field.key === "municipality")
      metadata[field.key] = "Belo Horizonte";
    else if (field.key === "issuingAuthority")
      metadata[field.key] = "Receita Federal";
    else if (field.key === "authenticationCode")
      metadata[field.key] = `AUTH-${String(index + 1).padStart(6, "0")}`;
    else if (field.key === "contractOwner")
      metadata[field.key] = "Área de Suprimentos";
    else if (field.key === "contractScope")
      metadata[field.key] =
        "Fornecimento contínuo de bens e serviços corporativos.";
    else if (field.key === "bank") metadata[field.key] = "Banco Demo";
    else if (field.key === "branch")
      metadata[field.key] = `0${100 + (index % 800)}`;
    else if (field.key === "account")
      metadata[field.key] = `${10000 + index}-0`;
    else if (field.key === "environmentalAgency") metadata[field.key] = "SEMAD";
    else if (field.key === "licenseCategory") metadata[field.key] = "Operação";
    else if (field.key === "insuranceCompany")
      metadata[field.key] = "Seguradora Demo";
    else if (field.key === "coverage")
      metadata[field.key] = "Responsabilidade civil";
    else if (field.key === "receivedBy")
      metadata[field.key] = "Equipe de Logística";
    else if (field.key === "deliveryLocation")
      metadata[field.key] = "Centro de Distribuição BH";
    else metadata[field.key] = `Valor de demonstração ${index + 1}`;
  }

  return metadata;
}

function enabledValidationCodes(type, metadata) {
  const codes = new Set(DEFAULT_VALIDATION_RULES);
  for (const rule of type.validationRules || []) {
    if (rule.enabled !== false) codes.add(rule.code);
  }
  if (type.hasExpiration) codes.add("DOCUMENT_NOT_EXPIRED");
  if (type.requiresPurchaseOrder) {
    codes.add("PURCHASE_ORDER_EXISTS");
    codes.add("PURCHASE_ORDER_SUPPLIER_MATCH");
    codes.add("PURCHASE_ORDER_AMOUNT");
  }
  if (metadata.supplierCnpj) codes.add("SUPPLIER_CNPJ_MATCH");
  return [...codes];
}

function validationResult(code, result, message, extra = {}) {
  const definition = VALIDATION_RULE_CATALOG[code] || {
    label: code,
    department: "Compliance",
    severity: "MEDIUM",
  };

  return {
    code,
    label: definition.label,
    result,
    message,
    department: definition.department,
    severity: definition.severity,
    checkedAt: now,
    ...extra,
  };
}

function passedMessage(code) {
  const messages = {
    REQUIRED_FIELDS: "Todos os campos obrigatórios foram preenchidos.",
    DUPLICATE_DOCUMENT: "Nenhum documento duplicado foi encontrado.",
    SUPPLIER_ACTIVE: "O fornecedor está ativo.",
    ISSUE_DATE_NOT_FUTURE: "A data de emissão é válida.",
    DOCUMENT_NOT_EXPIRED: "O documento está dentro da validade.",
    SUPPLIER_CNPJ_MATCH: "O CNPJ informado corresponde ao fornecedor.",
    PURCHASE_ORDER_EXISTS: "O pedido de compra está disponível.",
    PURCHASE_ORDER_SUPPLIER_MATCH:
      "O fornecedor corresponde ao pedido de compra.",
    PURCHASE_ORDER_AMOUNT: "O valor está dentro do saldo disponível do pedido.",
  };
  return messages[code] || "Validação executada com sucesso.";
}

function divergenceScenario(type, index) {
  if (type.requiresPurchaseOrder) {
    return [
      "PURCHASE_ORDER_AMOUNT",
      "SUPPLIER_CNPJ_MATCH",
      "PURCHASE_ORDER_SUPPLIER_MATCH",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
      "REQUIRED_FIELDS",
    ][index % 6];
  }

  if (type.hasExpiration) {
    return [
      "DOCUMENT_NOT_EXPIRED",
      "SUPPLIER_ACTIVE",
      "ISSUE_DATE_NOT_FUTURE",
      "REQUIRED_FIELDS",
    ][index % 4];
  }

  return ["SUPPLIER_ACTIVE", "ISSUE_DATE_NOT_FUTURE", "REQUIRED_FIELDS"][
    index % 3
  ];
}

function failedValidation(code, { supplier, purchaseOrder, amount }) {
  if (code === "PURCHASE_ORDER_AMOUNT") {
    return validationResult(
      code,
      VALIDATION_RESULT.FAILED,
      "O valor do documento ultrapassa o saldo do pedido.",
      {
        expectedValue: purchaseOrder?.remainingAmount ?? 0,
        receivedValue: amount,
      },
    );
  }
  if (code === "SUPPLIER_CNPJ_MATCH") {
    return validationResult(
      code,
      VALIDATION_RESULT.FAILED,
      "O CNPJ informado no documento diverge do fornecedor.",
      { expectedValue: supplier.cnpj, receivedValue: "99999999000199" },
    );
  }
  if (code === "PURCHASE_ORDER_SUPPLIER_MATCH") {
    return validationResult(
      code,
      VALIDATION_RESULT.FAILED,
      "O pedido de compra pertence a outro fornecedor.",
    );
  }
  if (code === "SUPPLIER_ACTIVE") {
    return validationResult(
      code,
      VALIDATION_RESULT.FAILED,
      "O fornecedor está inativo ou não foi encontrado.",
    );
  }
  if (code === "ISSUE_DATE_NOT_FUTURE") {
    return validationResult(
      code,
      VALIDATION_RESULT.FAILED,
      "A data de emissão não pode estar no futuro.",
    );
  }
  if (code === "DOCUMENT_NOT_EXPIRED") {
    return validationResult(
      code,
      VALIDATION_RESULT.FAILED,
      "O documento está vencido ou não possui validade informada.",
    );
  }
  return validationResult(
    "REQUIRED_FIELDS",
    VALIDATION_RESULT.FAILED,
    "Campos obrigatórios do tipo de documento não foram preenchidos.",
  );
}

function buildWorkflow(type, status, index) {
  const base = createWorkflowState(type.workflowTemplate || []);

  if (["DRAFT", "RECEIVED", "VALIDATING", "WITH_DIVERGENCE"].includes(status)) {
    return {
      currentStepIndex: null,
      steps: base.steps.map((step) => ({ ...step, status: "WAITING" })),
    };
  }

  if (status === "AWAITING_APPROVAL") {
    if (!base.steps.length) return base;
    const currentStepIndex = index % base.steps.length;
    return {
      currentStepIndex,
      steps: base.steps.map((step, stepIndex) => {
        if (stepIndex < currentStepIndex) {
          return {
            ...step,
            status: "APPROVED",
            decidedAt: daysAgo(2),
            decidedBy: actor,
            note: "Etapa aprovada durante a demonstração.",
          };
        }
        if (stepIndex === currentStepIndex)
          return { ...step, status: "PENDING" };
        return { ...step, status: "WAITING" };
      }),
    };
  }

  if (["APPROVED", "COMPLETED"].includes(status)) {
    return {
      currentStepIndex: null,
      steps: base.steps.map((step, stepIndex) => ({
        ...step,
        status: "APPROVED",
        decidedAt: daysAgo(Math.max(1, 4 - stepIndex)),
        decidedBy: actor,
        note: "Etapa aprovada no fluxo demonstrativo.",
      })),
    };
  }

  if (status === "REJECTED") {
    const rejectedIndex = base.steps.length > 1 ? 1 : 0;
    return {
      currentStepIndex: null,
      steps: base.steps.map((step, stepIndex) => {
        if (stepIndex < rejectedIndex) {
          return {
            ...step,
            status: "APPROVED",
            decidedAt: daysAgo(4),
            decidedBy: actor,
            note: "Etapa aprovada antes da rejeição.",
          };
        }
        if (stepIndex === rejectedIndex) {
          return {
            ...step,
            status: "REJECTED",
            decidedAt: daysAgo(2),
            decidedBy: actor,
            note: "Documento rejeitado por inconsistência comercial.",
          };
        }
        return { ...step, status: "WAITING" };
      }),
    };
  }

  return base;
}

function buildStatusHistory(status, createdAt) {
  const history = [];
  const push = (value, hours, note) =>
    history.push({
      status: value,
      changedAt: addHours(createdAt, hours),
      note,
    });

  if (status === "DRAFT") {
    push("DRAFT", 0, "Rascunho criado pela carga de demonstração.");
    return history;
  }

  push("RECEIVED", 0, "Documento recebido pela carga de demonstração.");
  if (status === "RECEIVED") return history;

  push("VALIDATING", 2, "Validações automáticas iniciadas.");
  if (status === "VALIDATING") return history;

  if (status === "WITH_DIVERGENCE") {
    push("WITH_DIVERGENCE", 3, "Uma divergência foi identificada.");
    return history;
  }

  push("AWAITING_APPROVAL", 3, "Documento encaminhado para aprovação.");
  if (status === "AWAITING_APPROVAL") return history;

  if (status === "REJECTED") {
    push("REJECTED", 30, "Documento rejeitado no fluxo demonstrativo.");
    return history;
  }

  push("APPROVED", 30, "Todas as etapas de aprovação foram concluídas.");
  if (status === "APPROVED") return history;

  push("COMPLETED", 40, "Documento escriturado no ERP simulado.");
  return history;
}

function resolvedDivergence(index) {
  const openedAt = daysAgo(12 + (index % 10));
  return {
    _id: new ObjectId(),
    validationCode: "REQUIRED_FIELDS",
    type: "REQUIRED_FIELDS",
    title: "Campos obrigatórios",
    description: "Um campo obrigatório precisou ser corrigido.",
    department: "Fornecedor",
    priority: "HIGH",
    status: "RESOLVED",
    openedAt,
    dueAt: daysAgo(9 + (index % 10)),
    resolvedAt: daysAgo(7 + (index % 5)),
    resolutionNote: "Fornecedor enviou os dados corrigidos.",
    resolvedBy: "João Lobo",
    comments: [
      {
        _id: new ObjectId(),
        text: "Correção solicitada ao fornecedor.",
        author: "João Lobo",
        createdAt: addHours(openedAt, 4),
      },
    ],
  };
}

function openDivergence(failed, index) {
  const openedAt = daysAgo(index % 8);
  return {
    _id: new ObjectId(),
    validationCode: failed.code,
    type: failed.code,
    title: failed.label,
    description: failed.message,
    department: failed.department,
    priority: failed.severity,
    status: "OPEN",
    openedAt,
    dueAt: daysFromNow(1 + (index % 5)),
    resolvedAt: null,
    resolutionNote: null,
    comments: [
      {
        _id: new ObjectId(),
        text: "Divergência encaminhada para análise da área responsável.",
        author: "Sistema",
        createdAt: addHours(openedAt, 1),
      },
    ],
  };
}

function expirationDateFor(type, status, index) {
  if (!type.hasExpiration) return null;
  if (status === "WITH_DIVERGENCE" && index % 4 === 0) return daysAgo(10);
  if (!["COMPLETED", "REJECTED"].includes(status) && index % 3 === 0) {
    return daysFromNow(5 + (index % 24));
  }
  return daysFromNow(60 + (index % 300));
}

function buildDocument({
  index,
  type,
  supplier,
  purchaseOrder,
  wrongPurchaseOrder,
}) {
  const status = statusSequence[index % statusSequence.length];
  const createdAt = daysAgo((index * 3) % 170);
  const divergenceCode =
    status === "WITH_DIVERGENCE" ? divergenceScenario(type, index) : null;

  let effectiveSupplier = supplier;
  let effectivePurchaseOrder = purchaseOrder;

  if (
    type.requiresPurchaseOrder &&
    divergenceCode === "PURCHASE_ORDER_SUPPLIER_MATCH"
  ) {
    effectivePurchaseOrder = wrongPurchaseOrder || purchaseOrder;
  }

  let issueDate = daysAgo(2 + (index % 120));
  if (divergenceCode === "ISSUE_DATE_NOT_FUTURE") issueDate = daysFromNow(5);

  const metadata = buildMetadata(type, effectiveSupplier, index);
  if (divergenceCode === "SUPPLIER_CNPJ_MATCH") {
    metadata.supplierCnpj = "99999999000199";
  }
  if (divergenceCode === "REQUIRED_FIELDS") {
    const requiredField = type.customFields?.find((field) => field.required);
    if (requiredField) delete metadata[requiredField.key];
  }

  const baseAmount = effectivePurchaseOrder
    ? Math.max(
        500,
        Math.round(effectivePurchaseOrder.remainingAmount * 0.12 * 100) / 100,
      )
    : 500 + ((index * 137) % 12000);
  const amount =
    divergenceCode === "PURCHASE_ORDER_AMOUNT" && effectivePurchaseOrder
      ? effectivePurchaseOrder.remainingAmount + 3500
      : type.category === "FISCAL"
        ? baseAmount
        : index % 4 === 0
          ? null
          : 300 + ((index * 211) % 9000);

  const expirationDate =
    divergenceCode === "DOCUMENT_NOT_EXPIRED"
      ? daysAgo(15)
      : expirationDateFor(type, status, index);

  let validations = [];
  if (!["DRAFT", "RECEIVED", "VALIDATING"].includes(status)) {
    const codes = enabledValidationCodes(type, metadata);
    validations = codes.map((code) =>
      code === divergenceCode
        ? failedValidation(code, {
            supplier: effectiveSupplier,
            purchaseOrder: effectivePurchaseOrder,
            amount,
          })
        : validationResult(code, VALIDATION_RESULT.PASSED, passedMessage(code)),
    );
  }

  const failed = validations.find(
    (item) => item.result === VALIDATION_RESULT.FAILED,
  );
  const divergences = failed
    ? [openDivergence(failed, index)]
    : ["APPROVED", "COMPLETED"].includes(status) && index % 5 === 0
      ? [resolvedDivergence(index)]
      : [];

  const workflow = buildWorkflow(type, status, index);
  const completed = status === DOCUMENT_STATUS.COMPLETED;
  const updatedAt = buildStatusHistory(status, createdAt).at(-1).changedAt;

  return {
    documentNumber: `DEMO-${type.code}-${String(index + 1).padStart(5, "0")}`,
    typeId: type._id,
    typeSnapshot: buildTypeSnapshot(type),
    supplierId: effectiveSupplier._id,
    supplierSnapshot: buildSupplierSnapshot(effectiveSupplier),
    purchaseOrderId: effectivePurchaseOrder?._id || null,
    purchaseOrderSnapshot: buildPurchaseOrderSnapshot(effectivePurchaseOrder),
    issueDate,
    expirationDate,
    amount,
    source: sourceOptions[index % sourceOptions.length],
    metadata,
    attachment: null,
    status,
    validations,
    divergences,
    workflow,
    erpIntegration: completed
      ? {
          status: "POSTED",
          protocol: `ERP-DEMO-${String(index + 1).padStart(6, "0")}`,
          postedAt: updatedAt,
        }
      : status === "APPROVED"
        ? { status: "READY", protocol: null, postedAt: null }
        : { status: "NOT_READY", protocol: null, postedAt: null },
    purchaseOrderApplied: Boolean(
      completed && effectivePurchaseOrder && amount && amount > 0,
    ),
    statusHistory: buildStatusHistory(status, createdAt),
    demoSeed: DEMO_TAG,
    demoIndex: index,
    createdAt,
    updatedAt,
  };
}

async function upsertDocumentTypes(database) {
  await database.collection("documentTypes").bulkWrite(
    documentTypeDefinitions.map((type) => ({
      updateOne: {
        filter: { code: type.code },
        update: { $set: type },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return database
    .collection("documentTypes")
    .find({ code: { $in: documentTypeDefinitions.map((type) => type.code) } })
    .sort({ code: 1 })
    .toArray();
}

async function upsertSuppliers(database) {
  const suppliers = Array.from({ length: SUPPLIER_COUNT }, (_, index) =>
    buildSupplier(index),
  );

  await database.collection("suppliers").bulkWrite(
    suppliers.map((supplier) => ({
      updateOne: {
        filter: { cnpj: supplier.cnpj },
        update: { $set: supplier },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return database
    .collection("suppliers")
    .find({ demoSeed: DEMO_TAG })
    .sort({ demoIndex: 1 })
    .toArray();
}

async function upsertPurchaseOrders(database, suppliers) {
  const purchaseOrders = Array.from(
    { length: PURCHASE_ORDER_COUNT },
    (_, index) =>
      buildPurchaseOrder(index, suppliers[index % suppliers.length]),
  );

  await database.collection("purchaseOrders").bulkWrite(
    purchaseOrders.map((purchaseOrder) => ({
      updateOne: {
        filter: { orderNumber: purchaseOrder.orderNumber },
        update: { $set: purchaseOrder },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return database
    .collection("purchaseOrders")
    .find({ demoSeed: DEMO_TAG })
    .sort({ demoIndex: 1 })
    .toArray();
}

async function upsertDocuments(database, types, suppliers, purchaseOrders) {
  const activeSuppliers = suppliers.filter(
    (supplier) => supplier.status === "ACTIVE",
  );
  const inactiveSuppliers = suppliers.filter(
    (supplier) => supplier.status === "INACTIVE",
  );
  const availableOrders = purchaseOrders.filter(
    (order) =>
      ["OPEN", "PARTIALLY_USED"].includes(order.status) &&
      order.remainingAmount > 0,
  );

  const documents = [];
  for (let index = 0; index < DOCUMENT_COUNT; index += 1) {
    const type = types[index % types.length];
    const status = statusSequence[index % statusSequence.length];
    const divergenceCode =
      status === "WITH_DIVERGENCE" ? divergenceScenario(type, index) : null;

    let purchaseOrder = null;
    let supplier = activeSuppliers[index % activeSuppliers.length];
    let wrongPurchaseOrder = null;

    if (type.requiresPurchaseOrder) {
      purchaseOrder = availableOrders[index % availableOrders.length];
      supplier = suppliers.find(
        (item) => item._id.toString() === purchaseOrder.supplierId.toString(),
      );

      if (divergenceCode === "PURCHASE_ORDER_SUPPLIER_MATCH") {
        supplier = activeSuppliers.find(
          (item) => item._id.toString() !== purchaseOrder.supplierId.toString(),
        );
        wrongPurchaseOrder = purchaseOrder;
      }
    }

    if (divergenceCode === "SUPPLIER_ACTIVE") {
      supplier = inactiveSuppliers[index % inactiveSuppliers.length];
      if (type.requiresPurchaseOrder) {
        const supplierOrder = availableOrders.find(
          (order) => order.supplierId.toString() === supplier._id.toString(),
        );
        if (supplierOrder) purchaseOrder = supplierOrder;
      }
    }

    documents.push(
      buildDocument({
        index,
        type,
        supplier,
        purchaseOrder,
        wrongPurchaseOrder,
      }),
    );
  }

  await database.collection("documents").bulkWrite(
    documents.map((document) => ({
      updateOne: {
        filter: { demoSeed: DEMO_TAG, demoIndex: document.demoIndex },
        update: { $set: document },
        upsert: true,
      },
    })),
    { ordered: false },
  );

  return database
    .collection("documents")
    .find({ demoSeed: DEMO_TAG })
    .sort({ demoIndex: 1 })
    .toArray();
}

async function synchronizePurchaseOrders(database, purchaseOrders, documents) {
  const completedByOrder = new Map();

  for (const document of documents) {
    if (!document.purchaseOrderApplied || !document.purchaseOrderId) continue;
    const key = document.purchaseOrderId.toString();
    if (!completedByOrder.has(key)) completedByOrder.set(key, []);
    completedByOrder.get(key).push(document);
  }

  const operations = purchaseOrders.map((purchaseOrder) => {
    const linkedDocuments =
      completedByOrder.get(purchaseOrder._id.toString()) || [];
    const consumed = linkedDocuments.reduce(
      (total, document) => total + Number(document.amount || 0),
      0,
    );
    const baseRemaining =
      purchaseOrder.status === "PARTIALLY_USED"
        ? Math.round(purchaseOrder.totalAmount * 0.58 * 100) / 100
        : purchaseOrder.status === "OPEN"
          ? purchaseOrder.totalAmount
          : 0;
    const remainingAmount = Math.max(
      0,
      Math.round((baseRemaining - consumed) * 100) / 100,
    );

    let status = purchaseOrder.status;
    if (linkedDocuments.length && !["CANCELLED", "CLOSED"].includes(status)) {
      status = remainingAmount <= 0 ? "CLOSED" : "PARTIALLY_USED";
    }

    const statusHistory = [...(purchaseOrder.statusHistory || [])];
    if (linkedDocuments.length) {
      statusHistory.push({
        status,
        changedAt: now,
        note: `${linkedDocuments.length} documento(s) demonstrativo(s) consumiram ${consumed.toLocaleString(
          "pt-BR",
          { style: "currency", currency: "BRL" },
        )}.`,
      });
    }

    return {
      updateOne: {
        filter: { _id: purchaseOrder._id },
        update: {
          $set: {
            remainingAmount,
            status,
            linkedDocuments: linkedDocuments.map((document) => ({
              documentId: document._id,
              documentNumber: document.documentNumber,
              amount: document.amount,
              appliedAt: document.erpIntegration.postedAt,
            })),
            statusHistory,
            updatedAt: now,
          },
        },
      },
    };
  });

  await database.collection("purchaseOrders").bulkWrite(operations, {
    ordered: false,
  });
}

async function upsertAuditLogs(database, documents) {
  const operations = [];

  for (const document of documents) {
    const base = {
      entityType: "DOCUMENT",
      entityId: document._id,
      actor,
      metadata: {
        documentNumber: document.documentNumber,
        status: document.status,
        demo: true,
      },
      demoSeed: DEMO_TAG,
    };

    operations.push({
      updateOne: {
        filter: {
          demoSeed: DEMO_TAG,
          auditKey: `${document.demoIndex}-CREATE`,
        },
        update: {
          $set: {
            ...base,
            auditKey: `${document.demoIndex}-CREATE`,
            action: "CREATE",
            description: `Documento ${document.documentNumber} cadastrado pela carga demonstrativa.`,
            occurredAt: document.createdAt,
          },
        },
        upsert: true,
      },
    });

    if (!["DRAFT", "RECEIVED"].includes(document.status)) {
      operations.push({
        updateOne: {
          filter: {
            demoSeed: DEMO_TAG,
            auditKey: `${document.demoIndex}-PROCESS`,
          },
          update: {
            $set: {
              ...base,
              auditKey: `${document.demoIndex}-PROCESS`,
              action:
                document.status === "COMPLETED"
                  ? "ERP_POST"
                  : document.status === "WITH_DIVERGENCE"
                    ? "VALIDATE_WITH_DIVERGENCE"
                    : "WORKFLOW_UPDATE",
              description: `Documento ${document.documentNumber} processado com status ${document.status}.`,
              occurredAt: document.updatedAt,
            },
          },
          upsert: true,
        },
      });
    }
  }

  await database.collection("auditLogs").bulkWrite(operations, {
    ordered: false,
  });
}

async function printSummary(database) {
  const [suppliers, purchaseOrders, documents, auditLogs, documentTypes] =
    await Promise.all([
      database.collection("suppliers").countDocuments({ demoSeed: DEMO_TAG }),
      database
        .collection("purchaseOrders")
        .countDocuments({ demoSeed: DEMO_TAG }),
      database.collection("documents").countDocuments({ demoSeed: DEMO_TAG }),
      database.collection("auditLogs").countDocuments({ demoSeed: DEMO_TAG }),
      database
        .collection("documentTypes")
        .countDocuments({
          code: { $in: documentTypeDefinitions.map((type) => type.code) },
        }),
    ]);

  const statusDistribution = await database
    .collection("documents")
    .aggregate([
      { $match: { demoSeed: DEMO_TAG } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])
    .toArray();

  console.log("\nCarga demonstrativa concluída:");
  console.log(`- ${suppliers} fornecedores`);
  console.log(`- ${purchaseOrders} pedidos de compra`);
  console.log(`- ${documentTypes} tipos de documento disponíveis`);
  console.log(`- ${documents} documentos`);
  console.log(`- ${auditLogs} registros de auditoria`);
  console.log("- distribuição de documentos:");
  for (const item of statusDistribution) {
    console.log(`  • ${item._id}: ${item.count}`);
  }
}

async function seedLargeDatabase() {
  try {
    const database = await connectToDatabase();

    console.log("Criando tipos de documento...");
    const types = await upsertDocumentTypes(database);

    console.log("Criando fornecedores...");
    const suppliers = await upsertSuppliers(database);

    console.log("Criando pedidos de compra...");
    const purchaseOrders = await upsertPurchaseOrders(database, suppliers);

    console.log("Criando documentos e cenários de workflow...");
    const documents = await upsertDocuments(
      database,
      types,
      suppliers,
      purchaseOrders,
    );

    console.log("Sincronizando saldos e documentos vinculados aos pedidos...");
    await synchronizePurchaseOrders(database, purchaseOrders, documents);

    console.log("Criando registros de auditoria...");
    await upsertAuditLogs(database, documents);

    await printSummary(database);
    process.exit(0);
  } catch (error) {
    console.error("Erro ao criar a base demonstrativa:");
    console.error(error);
    process.exit(1);
  }
}

seedLargeDatabase();
