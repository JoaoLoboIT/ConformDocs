import { ObjectId } from "mongodb";
import {
  DEFAULT_VALIDATION_RULES,
  VALIDATION_RESULT,
  VALIDATION_RULE_CATALOG,
} from "../config/domain.js";
import { normalizeCnpj } from "../utils/normalizers.js";

function findSupplierCnpjMetadata(metadata = {}) {
  const direct =
    metadata.supplierCnpj ?? metadata.suppliercnpj ?? metadata.supplier_cnpj;
  if (direct) return direct;

  const entry = Object.entries(metadata).find(([key]) =>
    key.toLowerCase().includes("cnpj"),
  );
  return entry?.[1] || "";
}

function buildResult(code, result, message, extra = {}) {
  const rule = VALIDATION_RULE_CATALOG[code] || {
    label: code,
    department: "Compliance",
    severity: "MEDIUM",
  };

  return {
    code,
    label: rule.label,
    result,
    message,
    department: rule.department,
    severity: rule.severity,
    checkedAt: new Date(),
    ...extra,
  };
}

function getEnabledRuleCodes(document) {
  const configured = (document.typeSnapshot.validationRules || [])
    .filter((rule) => rule.enabled !== false)
    .map((rule) => rule.code);

  const rules = new Set([...DEFAULT_VALIDATION_RULES, ...configured]);
  if (document.typeSnapshot.hasExpiration) rules.add("DOCUMENT_NOT_EXPIRED");
  if (document.typeSnapshot.requiresPurchaseOrder) {
    rules.add("PURCHASE_ORDER_EXISTS");
    rules.add("PURCHASE_ORDER_SUPPLIER_MATCH");
    rules.add("PURCHASE_ORDER_AMOUNT");
  }
  if (findSupplierCnpjMetadata(document.metadata))
    rules.add("SUPPLIER_CNPJ_MATCH");
  return [...rules];
}

function validateRequiredFields(document) {
  const missingFields = [];
  if (!document.documentNumber) missingFields.push("número do documento");
  if (!document.issueDate) missingFields.push("data de emissão");
  if (!document.supplierId) missingFields.push("fornecedor");
  if (!document.typeId) missingFields.push("tipo de documento");
  if (document.typeSnapshot.hasExpiration && !document.expirationDate)
    missingFields.push("data de vencimento");
  if (document.typeSnapshot.requiresPurchaseOrder && !document.purchaseOrderId)
    missingFields.push("pedido de compra");

  for (const field of document.typeSnapshot.customFields || []) {
    if (
      field.required &&
      (document.metadata?.[field.key] === undefined ||
        document.metadata?.[field.key] === "")
    ) {
      missingFields.push(field.label);
    }
  }

  return missingFields.length
    ? buildResult(
        "REQUIRED_FIELDS",
        VALIDATION_RESULT.FAILED,
        `Campos ausentes: ${missingFields.join(", ")}.`,
      )
    : buildResult(
        "REQUIRED_FIELDS",
        VALIDATION_RESULT.PASSED,
        "Todos os campos obrigatórios foram preenchidos.",
      );
}

export function runDocumentValidations({
  document,
  supplier,
  purchaseOrder,
  duplicateDocument,
}) {
  const results = [];
  const enabledRules = getEnabledRuleCodes(document);

  for (const code of enabledRules) {
    if (code === "REQUIRED_FIELDS") {
      results.push(validateRequiredFields(document));
    }

    if (code === "DUPLICATE_DOCUMENT") {
      results.push(
        duplicateDocument
          ? buildResult(
              code,
              VALIDATION_RESULT.FAILED,
              "Já existe um documento com o mesmo número, tipo e fornecedor.",
            )
          : buildResult(
              code,
              VALIDATION_RESULT.PASSED,
              "Nenhum documento duplicado foi encontrado.",
            ),
      );
    }

    if (code === "SUPPLIER_ACTIVE") {
      results.push(
        supplier?.status === "ACTIVE"
          ? buildResult(
              code,
              VALIDATION_RESULT.PASSED,
              "O fornecedor está ativo.",
            )
          : buildResult(
              code,
              VALIDATION_RESULT.FAILED,
              "O fornecedor está inativo ou não foi encontrado.",
            ),
      );
    }

    if (code === "ISSUE_DATE_NOT_FUTURE") {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const valid =
        document.issueDate && new Date(document.issueDate) <= endOfToday;
      results.push(
        valid
          ? buildResult(
              code,
              VALIDATION_RESULT.PASSED,
              "A data de emissão é válida.",
            )
          : buildResult(
              code,
              VALIDATION_RESULT.FAILED,
              "A data de emissão não pode estar no futuro.",
            ),
      );
    }

    if (code === "DOCUMENT_NOT_EXPIRED") {
      const expiration = document.expirationDate
        ? new Date(document.expirationDate)
        : null;
      if (expiration) expiration.setHours(23, 59, 59, 999);
      const valid = expiration && expiration >= new Date();
      results.push(
        valid
          ? buildResult(
              code,
              VALIDATION_RESULT.PASSED,
              "O documento está dentro da validade.",
            )
          : buildResult(
              code,
              VALIDATION_RESULT.FAILED,
              "O documento está vencido ou não possui validade informada.",
            ),
      );
    }

    if (code === "SUPPLIER_CNPJ_MATCH") {
      const received = normalizeCnpj(
        findSupplierCnpjMetadata(document.metadata),
      );
      const expected = supplier?.cnpj;
      results.push(
        received && received === expected
          ? buildResult(
              code,
              VALIDATION_RESULT.PASSED,
              "O CNPJ informado corresponde ao fornecedor.",
            )
          : buildResult(
              code,
              VALIDATION_RESULT.FAILED,
              "O CNPJ informado no documento diverge do fornecedor.",
              {
                expectedValue: expected,
                receivedValue: received,
              },
            ),
      );
    }

    if (code === "PURCHASE_ORDER_EXISTS") {
      const available =
        purchaseOrder &&
        ["OPEN", "PARTIALLY_USED"].includes(purchaseOrder.status);
      results.push(
        available
          ? buildResult(
              code,
              VALIDATION_RESULT.PASSED,
              "O pedido de compra está disponível.",
            )
          : buildResult(
              code,
              VALIDATION_RESULT.FAILED,
              "O pedido de compra não foi localizado ou não está disponível.",
            ),
      );
    }

    if (code === "PURCHASE_ORDER_SUPPLIER_MATCH") {
      const matches =
        purchaseOrder &&
        supplier &&
        purchaseOrder.supplierId.toString() === supplier._id.toString();
      results.push(
        matches
          ? buildResult(
              code,
              VALIDATION_RESULT.PASSED,
              "O fornecedor corresponde ao pedido de compra.",
            )
          : buildResult(
              code,
              VALIDATION_RESULT.FAILED,
              "O pedido de compra pertence a outro fornecedor.",
            ),
      );
    }

    if (code === "PURCHASE_ORDER_AMOUNT") {
      if (!purchaseOrder) {
        results.push(
          buildResult(
            code,
            VALIDATION_RESULT.SKIPPED,
            "Validação ignorada porque o pedido não foi encontrado.",
          ),
        );
      } else {
        const amount = Number(document.amount || 0);
        const valid =
          amount > 0 && amount <= Number(purchaseOrder.remainingAmount);
        results.push(
          valid
            ? buildResult(
                code,
                VALIDATION_RESULT.PASSED,
                "O valor está dentro do saldo disponível do pedido.",
              )
            : buildResult(
                code,
                VALIDATION_RESULT.FAILED,
                "O valor do documento ultrapassa o saldo do pedido.",
                {
                  expectedValue: purchaseOrder.remainingAmount,
                  receivedValue: amount,
                },
              ),
        );
      }
    }
  }

  return results;
}

export function mergeDivergences(
  existingDivergences = [],
  validationResults = [],
) {
  const now = new Date();
  const merged = existingDivergences.map((divergence) => ({ ...divergence }));

  for (const validation of validationResults) {
    const existingIndex = merged.findIndex(
      (item) => item.validationCode === validation.code,
    );

    if (validation.result === VALIDATION_RESULT.FAILED) {
      const base = {
        validationCode: validation.code,
        type: validation.code,
        title: validation.label,
        description: validation.message,
        department: validation.department,
        priority: validation.severity,
        status: "OPEN",
        openedAt: existingIndex >= 0 ? merged[existingIndex].openedAt : now,
        dueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        comments:
          existingIndex >= 0 ? merged[existingIndex].comments || [] : [],
      };

      if (existingIndex >= 0) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...base,
          resolvedAt: null,
          resolutionNote: null,
        };
      } else {
        merged.push({ _id: new ObjectId(), ...base });
      }
    } else if (
      validation.result === VALIDATION_RESULT.PASSED &&
      existingIndex >= 0 &&
      merged[existingIndex].status === "OPEN"
    ) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        status: "RESOLVED",
        resolvedAt: now,
        resolutionNote:
          "Divergência resolvida automaticamente após nova validação.",
      };
    }
  }

  return merged;
}
