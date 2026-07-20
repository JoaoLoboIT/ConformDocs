export const SUPPLIER_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

export const PURCHASE_ORDER_STATUS = Object.freeze({
  OPEN: "OPEN",
  PARTIALLY_USED: "PARTIALLY_USED",
  CLOSED: "CLOSED",
  CANCELLED: "CANCELLED",
});

export const DOCUMENT_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  RECEIVED: "RECEIVED",
  VALIDATING: "VALIDATING",
  WITH_DIVERGENCE: "WITH_DIVERGENCE",
  AWAITING_APPROVAL: "AWAITING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  COMPLETED: "COMPLETED",
});

export const VALIDATION_RESULT = Object.freeze({
  PASSED: "PASSED",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
});

export const DOCUMENT_SOURCE = Object.freeze({
  SUPPLIER_PORTAL: "SUPPLIER_PORTAL",
  EMAIL: "EMAIL",
  AUTOMATIC_CAPTURE: "AUTOMATIC_CAPTURE",
  MANUAL: "MANUAL",
});

export const DOCUMENT_CATEGORY = Object.freeze({
  FISCAL: "FISCAL",
  NON_FISCAL: "NON_FISCAL",
});

export const DEPARTMENTS = Object.freeze({
  FISCAL: "Fiscal",
  PURCHASING: "Compras",
  FINANCE: "Financeiro",
  COMPLIANCE: "Compliance",
  LEGAL: "Jurídico",
  LOGISTICS: "Logística",
  SUPPLIER: "Fornecedor",
});

export const VALIDATION_RULE_CATALOG = Object.freeze({
  REQUIRED_FIELDS: {
    code: "REQUIRED_FIELDS",
    label: "Campos obrigatórios",
    department: DEPARTMENTS.SUPPLIER,
    severity: "HIGH",
  },
  DUPLICATE_DOCUMENT: {
    code: "DUPLICATE_DOCUMENT",
    label: "Documento duplicado",
    department: DEPARTMENTS.FISCAL,
    severity: "HIGH",
  },
  SUPPLIER_ACTIVE: {
    code: "SUPPLIER_ACTIVE",
    label: "Fornecedor ativo",
    department: DEPARTMENTS.PURCHASING,
    severity: "HIGH",
  },
  ISSUE_DATE_NOT_FUTURE: {
    code: "ISSUE_DATE_NOT_FUTURE",
    label: "Data de emissão válida",
    department: DEPARTMENTS.FISCAL,
    severity: "MEDIUM",
  },
  DOCUMENT_NOT_EXPIRED: {
    code: "DOCUMENT_NOT_EXPIRED",
    label: "Documento dentro da validade",
    department: DEPARTMENTS.SUPPLIER,
    severity: "HIGH",
  },
  SUPPLIER_CNPJ_MATCH: {
    code: "SUPPLIER_CNPJ_MATCH",
    label: "CNPJ do documento corresponde ao fornecedor",
    department: DEPARTMENTS.FISCAL,
    severity: "HIGH",
  },
  PURCHASE_ORDER_EXISTS: {
    code: "PURCHASE_ORDER_EXISTS",
    label: "Pedido de compra existente",
    department: DEPARTMENTS.PURCHASING,
    severity: "HIGH",
  },
  PURCHASE_ORDER_SUPPLIER_MATCH: {
    code: "PURCHASE_ORDER_SUPPLIER_MATCH",
    label: "Fornecedor corresponde ao pedido",
    department: DEPARTMENTS.PURCHASING,
    severity: "HIGH",
  },
  PURCHASE_ORDER_AMOUNT: {
    code: "PURCHASE_ORDER_AMOUNT",
    label: "Valor dentro do saldo do pedido",
    department: DEPARTMENTS.PURCHASING,
    severity: "HIGH",
  },
});

export const DEFAULT_VALIDATION_RULES = Object.freeze([
  "REQUIRED_FIELDS",
  "DUPLICATE_DOCUMENT",
  "SUPPLIER_ACTIVE",
  "ISSUE_DATE_NOT_FUTURE",
]);
