export function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

export function normalizeCnpj(value) {
  return onlyDigits(value);
}

export function normalizePhone(value) {
  return onlyDigits(value);
}

export function normalizeCode(value = "") {
  return String(value)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeDocumentNumber(value = "") {
  return String(value).trim().toUpperCase();
}

export function toArray(value) {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function parseBoolean(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

export function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function safeJsonParse(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
