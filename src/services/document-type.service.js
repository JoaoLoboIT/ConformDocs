import {
  DOCUMENT_CATEGORY,
  VALIDATION_RULE_CATALOG,
} from "../config/domain.js";
import { AppError } from "../errors/app-error.js";
import {
  findActiveDocumentTypes,
  findAllDocumentTypes,
  findDocumentTypeByCode,
  findDocumentTypeById,
  insertDocumentType,
  updateDocumentTypeById,
} from "../repositories/document-type.repository.js";
import {
  normalizeCode,
  parseBoolean,
  safeJsonParse,
  toArray,
} from "../utils/normalizers.js";
import { registerAudit } from "./audit.service.js";
import { buildDefaultWorkflowTemplate } from "./workflow.service.js";

const ALLOWED_FIELD_TYPES = new Set([
  "text",
  "number",
  "date",
  "textarea",
  "select",
]);

function parseCustomFields(data) {
  const rawFields = safeJsonParse(data.customFieldsJson, []);
  if (!Array.isArray(rawFields))
    throw new AppError("A configuração dos campos personalizados é inválida.");
  if (rawFields.length > 12)
    throw new AppError("Cadastre no máximo 12 campos personalizados.");

  const keys = new Set();
  return rawFields
    .map((field) => ({
      key: normalizeCode(field.key).toLowerCase(),
      label: String(field.label || "").trim(),
      type: field.type,
      required: Boolean(field.required),
      options: Array.isArray(field.options)
        ? field.options.map((item) => String(item).trim()).filter(Boolean)
        : [],
    }))
    .filter((field) => field.key || field.label)
    .map((field) => {
      if (!field.key || !field.label || !ALLOWED_FIELD_TYPES.has(field.type)) {
        throw new AppError(
          "Preencha corretamente todos os campos personalizados.",
        );
      }
      if (keys.has(field.key))
        throw new AppError(
          `O campo personalizado ${field.key} está duplicado.`,
        );
      if (field.type === "select" && !field.options.length) {
        throw new AppError(`Informe opções para o campo ${field.label}.`);
      }
      keys.add(field.key);
      return field;
    });
}

function normalizeValidationRules(data, typeConfig) {
  const selectedCodes = new Set(toArray(data.validationRules));
  const conditionalCodes = [];
  if (typeConfig.hasExpiration) conditionalCodes.push("DOCUMENT_NOT_EXPIRED");
  if (typeConfig.requiresPurchaseOrder) {
    conditionalCodes.push(
      "PURCHASE_ORDER_EXISTS",
      "PURCHASE_ORDER_SUPPLIER_MATCH",
      "PURCHASE_ORDER_AMOUNT",
    );
  }

  for (const code of conditionalCodes) selectedCodes.add(code);

  return [...selectedCodes]
    .filter((code) => VALIDATION_RULE_CATALOG[code])
    .map((code) => ({ ...VALIDATION_RULE_CATALOG[code], enabled: true }));
}

function normalizeDocumentType(data) {
  const typeConfig = {
    name: data.name?.trim(),
    code: normalizeCode(data.code),
    description: data.description?.trim(),
    category: data.category,
    hasExpiration: parseBoolean(data.hasExpiration),
    requiresPurchaseOrder: parseBoolean(data.requiresPurchaseOrder),
    status: data.status || "ACTIVE",
  };

  if (
    !typeConfig.name ||
    !typeConfig.code ||
    !typeConfig.description ||
    !typeConfig.category
  ) {
    throw new AppError("Todos os campos obrigatórios devem ser preenchidos.");
  }
  if (!Object.values(DOCUMENT_CATEGORY).includes(typeConfig.category)) {
    throw new AppError("A categoria informada é inválida.");
  }
  if (!["ACTIVE", "INACTIVE"].includes(typeConfig.status)) {
    throw new AppError("O status informado é inválido.");
  }

  return {
    ...typeConfig,
    customFields: parseCustomFields(data),
    validationRules: normalizeValidationRules(data, typeConfig),
    workflowTemplate: buildDefaultWorkflowTemplate(typeConfig),
  };
}

export async function listDocumentTypes(filters = {}) {
  return findAllDocumentTypes(filters);
}

export async function listActiveDocumentTypes() {
  return findActiveDocumentTypes();
}

export async function getDocumentTypeById(id) {
  const documentType = await findDocumentTypeById(id);
  if (!documentType)
    throw new AppError("Tipo de documento não encontrado.", 404);
  return documentType;
}

export async function createDocumentType(data) {
  const documentType = normalizeDocumentType(data);
  if (await findDocumentTypeByCode(documentType.code)) {
    throw new AppError("Já existe um tipo de documento com este código.");
  }

  const now = new Date();
  const created = await insertDocumentType({
    ...documentType,
    createdAt: now,
    updatedAt: now,
  });
  await registerAudit({
    entityType: "DOCUMENT_TYPE",
    entityId: created._id,
    action: "CREATE",
    description: `Tipo de documento ${created.name} cadastrado.`,
  });
  return created;
}

export async function updateDocumentType(id, data) {
  await getDocumentTypeById(id);
  const documentType = normalizeDocumentType(data);
  const sameCode = await findDocumentTypeByCode(documentType.code);
  if (sameCode && sameCode._id.toString() !== id) {
    throw new AppError("Já existe outro tipo de documento com este código.");
  }

  const updated = await updateDocumentTypeById(id, {
    ...documentType,
    updatedAt: new Date(),
  });
  await registerAudit({
    entityType: "DOCUMENT_TYPE",
    entityId: updated._id,
    action: "UPDATE",
    description: `Tipo de documento ${updated.name} atualizado.`,
  });
  return updated;
}

export function getValidationRuleCatalog() {
  return Object.values(VALIDATION_RULE_CATALOG);
}
