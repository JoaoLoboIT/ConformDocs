import { ObjectId } from "mongodb";
import {
  DOCUMENT_SOURCE,
  DOCUMENT_STATUS,
  VALIDATION_RESULT,
} from "../config/domain.js";
import { AppError } from "../errors/app-error.js";
import {
  deleteDocumentById,
  findAllDocuments,
  findDocumentById,
  findDuplicateDocument,
  insertDocument,
  updateDocumentById,
} from "../repositories/document.repository.js";
import {
  consumePurchaseOrderAmount,
  findPurchaseOrderById,
} from "../repositories/purchase-order.repository.js";
import {
  normalizeDocumentNumber,
  safeJsonParse,
} from "../utils/normalizers.js";
import { registerAudit } from "./audit.service.js";
import {
  mergeDivergences,
  runDocumentValidations,
} from "./document-validation.service.js";
import { getDocumentTypeById } from "./document-type.service.js";
import { saveBase64Attachment } from "./file-storage.service.js";
import { getPurchaseOrderById } from "./purchase-order.service.js";
import { getSupplierById } from "./supplier.service.js";
import {
  approveCurrentWorkflowStep,
  createWorkflowState,
  rejectCurrentWorkflowStep,
} from "./workflow.service.js";

const FINAL_STATUSES = new Set([DOCUMENT_STATUS.COMPLETED]);

function parseDate(value, label, required = false) {
  if (!value) {
    if (required) throw new AppError(`Informe ${label}.`);
    return null;
  }

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new AppError(`${label} inválida.`);
  return date;
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

async function normalizeDocumentInput(data, existingDocument = null) {
  const type = await getDocumentTypeById(data.typeId);
  const supplier = await getSupplierById(data.supplierId);

  if (type.status !== "ACTIVE" && !existingDocument) {
    throw new AppError("O tipo de documento selecionado está inativo.");
  }

  const documentNumber = normalizeDocumentNumber(data.documentNumber);
  const issueDate = parseDate(data.issueDate, "a data de emissão", true);
  const expirationDate = parseDate(
    data.expirationDate,
    "a data de vencimento",
    type.hasExpiration,
  );
  const amount =
    data.amount === "" || data.amount === undefined
      ? null
      : Number(data.amount);
  const source = data.source;
  const metadata = safeJsonParse(data.metadataJson, {});

  if (!documentNumber) throw new AppError("Informe o número do documento.");
  if (!Object.values(DOCUMENT_SOURCE).includes(source))
    throw new AppError("A origem do documento é inválida.");
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    throw new AppError("O valor do documento é inválido.");
  }

  let purchaseOrder = null;
  if (data.purchaseOrderId) {
    purchaseOrder = await getPurchaseOrderById(data.purchaseOrderId);
  }
  if (type.requiresPurchaseOrder && !purchaseOrder) {
    throw new AppError("Este tipo de documento exige um pedido de compra.");
  }

  const newAttachment = await saveBase64Attachment({
    fileData: data.fileData,
    fileName: data.fileName,
    fileMimeType: data.fileMimeType,
  });

  return {
    documentNumber,
    typeId: type._id,
    typeSnapshot: buildTypeSnapshot(type),
    supplierId: supplier._id,
    supplierSnapshot: buildSupplierSnapshot(supplier),
    purchaseOrderId: purchaseOrder?._id || null,
    purchaseOrderSnapshot: buildPurchaseOrderSnapshot(purchaseOrder),
    issueDate,
    expirationDate,
    amount,
    source,
    metadata,
    attachment: newAttachment || existingDocument?.attachment || null,
  };
}

export async function listDocuments(filters = {}) {
  return findAllDocuments(filters);
}

export async function getDocumentById(id) {
  const document = await findDocumentById(id);
  if (!document) throw new AppError("Documento não encontrado.", 404);
  return document;
}

export async function createDocument(data) {
  const normalized = await normalizeDocumentInput(data);
  const now = new Date();
  const action = data.submissionAction === "process" ? "process" : "draft";
  const status =
    action === "process" ? DOCUMENT_STATUS.RECEIVED : DOCUMENT_STATUS.DRAFT;

  const created = await insertDocument({
    ...normalized,
    status,
    validations: [],
    divergences: [],
    workflow: { currentStepIndex: null, steps: [] },
    erpIntegration: { status: "NOT_READY", protocol: null, postedAt: null },
    purchaseOrderApplied: false,
    statusHistory: [
      {
        status,
        changedAt: now,
        note: action === "process" ? "Documento recebido." : "Rascunho criado.",
      },
    ],
    createdAt: now,
    updatedAt: now,
  });

  await registerAudit({
    entityType: "DOCUMENT",
    entityId: created._id,
    action: "CREATE",
    description: `Documento ${created.documentNumber} cadastrado.`,
  });

  return action === "process"
    ? validateAndRouteDocument(created._id.toString())
    : created;
}

export async function updateDocument(id, data) {
  const existing = await getDocumentById(id);
  if (FINAL_STATUSES.has(existing.status)) {
    throw new AppError("Documentos concluídos não podem ser alterados.");
  }

  const normalized = await normalizeDocumentInput(data, existing);
  const action = data.submissionAction === "process" ? "process" : "draft";
  const status =
    action === "process" ? DOCUMENT_STATUS.RECEIVED : DOCUMENT_STATUS.DRAFT;
  const now = new Date();

  const updated = await updateDocumentById(id, {
    ...normalized,
    status,
    validations: action === "process" ? existing.validations || [] : [],
    workflow:
      action === "process"
        ? existing.workflow
        : { currentStepIndex: null, steps: [] },
    statusHistory: [
      ...(existing.statusHistory || []),
      {
        status,
        changedAt: now,
        note:
          action === "process"
            ? "Documento reenviado para validação."
            : "Rascunho atualizado.",
      },
    ],
    updatedAt: now,
  });

  await registerAudit({
    entityType: "DOCUMENT",
    entityId: updated._id,
    action: "UPDATE",
    description: `Documento ${updated.documentNumber} atualizado.`,
  });

  return action === "process" ? validateAndRouteDocument(id) : updated;
}

export async function validateAndRouteDocument(id) {
  const document = await getDocumentById(id);
  if (document.status === DOCUMENT_STATUS.COMPLETED) {
    throw new AppError("Documentos concluídos não podem ser revalidados.");
  }

  const supplier = await getSupplierById(document.supplierId.toString());
  const purchaseOrder = document.purchaseOrderId
    ? await findPurchaseOrderById(document.purchaseOrderId.toString())
    : null;
  const duplicateDocument = await findDuplicateDocument({
    documentNumber: document.documentNumber,
    supplierId: document.supplierId.toString(),
    typeId: document.typeId.toString(),
    excludeId: document._id.toString(),
  });

  const validations = runDocumentValidations({
    document,
    supplier,
    purchaseOrder,
    duplicateDocument,
  });
  const divergences = mergeDivergences(document.divergences || [], validations);
  const failedValidations = validations.filter(
    (item) => item.result === VALIDATION_RESULT.FAILED,
  );
  const now = new Date();

  let status;
  let workflow;
  if (failedValidations.length) {
    status = DOCUMENT_STATUS.WITH_DIVERGENCE;
    const baseWorkflow = createWorkflowState(
      document.typeSnapshot.workflowTemplate,
    );
    workflow = {
      currentStepIndex: null,
      steps: baseWorkflow.steps.map((step) => ({ ...step, status: "WAITING" })),
    };
  } else {
    workflow = createWorkflowState(document.typeSnapshot.workflowTemplate);
    status = workflow.steps.length
      ? DOCUMENT_STATUS.AWAITING_APPROVAL
      : DOCUMENT_STATUS.APPROVED;
  }

  const updated = await updateDocumentById(id, {
    validations,
    divergences,
    workflow,
    status,
    erpIntegration: {
      status: status === DOCUMENT_STATUS.APPROVED ? "READY" : "NOT_READY",
      protocol: null,
      postedAt: null,
    },
    statusHistory: [
      ...(document.statusHistory || []),
      {
        status,
        changedAt: now,
        note: failedValidations.length
          ? `${failedValidations.length} divergência(s) identificada(s).`
          : "Validações concluídas com sucesso.",
      },
    ],
    updatedAt: now,
  });

  await registerAudit({
    entityType: "DOCUMENT",
    entityId: updated._id,
    action: "VALIDATE",
    description: `Documento ${updated.documentNumber} validado.`,
    metadata: { failedValidations: failedValidations.length },
  });

  return updated;
}

export async function addDivergenceComment(
  documentId,
  divergenceId,
  commentText,
) {
  const document = await getDocumentById(documentId);
  if (!ObjectId.isValid(divergenceId))
    throw new AppError("Divergência inválida.");
  const comment = commentText?.trim();
  if (!comment) throw new AppError("Digite um comentário.");

  const divergence = document.divergences?.find(
    (item) => item._id.toString() === divergenceId,
  );
  if (!divergence) throw new AppError("Divergência não encontrada.", 404);

  divergence.comments = [
    ...(divergence.comments || []),
    {
      _id: new ObjectId(),
      text: comment,
      author: "João Lobo",
      createdAt: new Date(),
    },
  ];

  const updated = await updateDocumentById(documentId, {
    divergences: document.divergences,
    updatedAt: new Date(),
  });
  await registerAudit({
    entityType: "DOCUMENT",
    entityId: updated._id,
    action: "DIVERGENCE_COMMENT",
    description: `Comentário adicionado à divergência do documento ${updated.documentNumber}.`,
  });
  return updated;
}

export async function resolveDivergence(
  documentId,
  divergenceId,
  resolutionNote,
) {
  const document = await getDocumentById(documentId);
  const note = resolutionNote?.trim();
  if (!note) throw new AppError("Informe como a divergência foi tratada.");

  const divergence = document.divergences?.find(
    (item) => item._id.toString() === divergenceId,
  );
  if (!divergence) throw new AppError("Divergência não encontrada.", 404);
  if (divergence.status === "RESOLVED")
    throw new AppError("Esta divergência já está resolvida.");

  divergence.status = "RESOLVED";
  divergence.resolvedAt = new Date();
  divergence.resolutionNote = note;
  divergence.resolvedBy = "João Lobo";

  const updated = await updateDocumentById(documentId, {
    divergences: document.divergences,
    updatedAt: new Date(),
  });
  await registerAudit({
    entityType: "DOCUMENT",
    entityId: updated._id,
    action: "DIVERGENCE_RESOLVE",
    description: `Divergência do documento ${updated.documentNumber} marcada como resolvida.`,
  });
  return updated;
}

export async function approveDocument(id, note) {
  const document = await getDocumentById(id);
  if (document.status !== DOCUMENT_STATUS.AWAITING_APPROVAL) {
    throw new AppError("O documento não está aguardando aprovação.");
  }

  const decision = approveCurrentWorkflowStep(document.workflow, note, {
    name: "João Lobo",
    role: "Administrador",
  });
  const status = decision.finished
    ? DOCUMENT_STATUS.APPROVED
    : DOCUMENT_STATUS.AWAITING_APPROVAL;
  const now = new Date();

  const updated = await updateDocumentById(id, {
    workflow: decision.workflow,
    status,
    erpIntegration: {
      status: decision.finished ? "READY" : "NOT_READY",
      protocol: null,
      postedAt: null,
    },
    statusHistory: [
      ...(document.statusHistory || []),
      {
        status,
        changedAt: now,
        note: decision.finished
          ? "Todas as aprovações foram concluídas."
          : "Etapa aprovada; fluxo avançado.",
      },
    ],
    updatedAt: now,
  });

  await registerAudit({
    entityType: "DOCUMENT",
    entityId: updated._id,
    action: "APPROVE",
    description: `Etapa do documento ${updated.documentNumber} aprovada.`,
  });
  return updated;
}

export async function rejectDocument(id, note) {
  const document = await getDocumentById(id);
  if (document.status !== DOCUMENT_STATUS.AWAITING_APPROVAL) {
    throw new AppError("O documento não está aguardando aprovação.");
  }
  if (!note?.trim()) throw new AppError("Informe o motivo da rejeição.");

  const workflow = rejectCurrentWorkflowStep(document.workflow, note, {
    name: "João Lobo",
    role: "Administrador",
  });
  const now = new Date();
  const updated = await updateDocumentById(id, {
    workflow,
    status: DOCUMENT_STATUS.REJECTED,
    statusHistory: [
      ...(document.statusHistory || []),
      { status: DOCUMENT_STATUS.REJECTED, changedAt: now, note: note.trim() },
    ],
    updatedAt: now,
  });

  await registerAudit({
    entityType: "DOCUMENT",
    entityId: updated._id,
    action: "REJECT",
    description: `Documento ${updated.documentNumber} rejeitado.`,
    metadata: { reason: note.trim() },
  });
  return updated;
}

export async function integrateDocumentWithErp(id) {
  const document = await getDocumentById(id);
  if (document.status !== DOCUMENT_STATUS.APPROVED) {
    throw new AppError(
      "Somente documentos aprovados podem ser enviados ao ERP.",
    );
  }

  if (
    document.purchaseOrderId &&
    document.amount > 0 &&
    !document.purchaseOrderApplied
  ) {
    const consumed = await consumePurchaseOrderAmount(
      document.purchaseOrderId.toString(),
      document.amount,
      {
        documentId: document._id,
        documentNumber: document.documentNumber,
        amount: document.amount,
        appliedAt: new Date(),
      },
    );
    if (!consumed) {
      throw new AppError(
        "O saldo do pedido de compra não é mais suficiente. Revalide o documento.",
      );
    }
  }

  const now = new Date();
  const protocol = `ERP-${now.getFullYear()}-${String(Date.now()).slice(-8)}`;
  const updated = await updateDocumentById(id, {
    status: DOCUMENT_STATUS.COMPLETED,
    purchaseOrderApplied:
      Boolean(document.purchaseOrderId && document.amount > 0) ||
      document.purchaseOrderApplied,
    erpIntegration: { status: "POSTED", protocol, postedAt: now },
    statusHistory: [
      ...(document.statusHistory || []),
      {
        status: DOCUMENT_STATUS.COMPLETED,
        changedAt: now,
        note: `Escrituração simulada no ERP. Protocolo ${protocol}.`,
      },
    ],
    updatedAt: now,
  });

  await registerAudit({
    entityType: "DOCUMENT",
    entityId: updated._id,
    action: "ERP_POST",
    description: `Documento ${updated.documentNumber} escriturado no ERP simulado.`,
    metadata: { protocol },
  });
  return updated;
}

export async function removeDocument(id) {
  const document = await getDocumentById(id);
  if (
    ![DOCUMENT_STATUS.DRAFT, DOCUMENT_STATUS.REJECTED].includes(document.status)
  ) {
    throw new AppError(
      "Somente documentos em rascunho ou rejeitados podem ser excluídos.",
    );
  }

  await deleteDocumentById(id);
  await registerAudit({
    entityType: "DOCUMENT",
    entityId: document._id,
    action: "DELETE",
    description: `Documento ${document.documentNumber} excluído.`,
  });
  return document;
}
