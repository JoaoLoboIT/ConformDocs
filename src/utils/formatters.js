const STATUS_LABELS = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  OPEN: "Aberto",
  PARTIALLY_USED: "Parcialmente utilizado",
  CLOSED: "Encerrado",
  CANCELLED: "Cancelado",
  DRAFT: "Rascunho",
  RECEIVED: "Recebido",
  VALIDATING: "Em validação",
  WITH_DIVERGENCE: "Com divergência",
  AWAITING_APPROVAL: "Aguardando aprovação",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  COMPLETED: "Concluído",
  PASSED: "Aprovado",
  FAILED: "Reprovado",
  SKIPPED: "Ignorado",
  WAITING: "Aguardando",
  PENDING: "Pendente",
  RESOLVED: "Resolvida",
  POSTED: "Escriturado",
  READY: "Pronto para ERP",
  NOT_READY: "Não disponível",
};

const SOURCE_LABELS = {
  SUPPLIER_PORTAL: "Portal do fornecedor",
  EMAIL: "E-mail",
  AUTOMATIC_CAPTURE: "Captura automática",
  MANUAL: "Cadastro manual",
};

export function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("pt-BR");
}

export function formatCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length !== 14) {
    return value || "—";
  }

  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5",
  );
}

export function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }
  return value || "—";
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "—";
}

export function statusClass(status) {
  const positive = [
    "ACTIVE",
    "OPEN",
    "APPROVED",
    "COMPLETED",
    "PASSED",
    "RESOLVED",
    "POSTED",
  ];
  const warning = [
    "PARTIALLY_USED",
    "AWAITING_APPROVAL",
    "PENDING",
    "READY",
    "RECEIVED",
    "VALIDATING",
  ];
  const danger = [
    "INACTIVE",
    "CANCELLED",
    "WITH_DIVERGENCE",
    "REJECTED",
    "FAILED",
  ];

  if (positive.includes(status)) return "badge--success";
  if (warning.includes(status)) return "badge--warning";
  if (danger.includes(status)) return "badge--danger";
  return "badge--neutral";
}

export function serializeForHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function sourceLabel(source) {
  return SOURCE_LABELS[source] || source || "—";
}
