import {
  formatCnpj,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPhone,
  serializeForHtml,
  sourceLabel,
  statusClass,
  statusLabel,
} from "../utils/formatters.js";

export function viewLocalsMiddleware(request, response, next) {
  response.locals.currentPath = request.path;
  response.locals.successMessage = request.query.success || null;
  response.locals.globalErrorMessage = request.query.error || null;
  response.locals.currentUser = {
    name: "João Lobo",
    role: "Administrador",
  };
  response.locals.formatCurrency = formatCurrency;
  response.locals.formatDate = formatDate;
  response.locals.formatDateTime = formatDateTime;
  response.locals.formatCnpj = formatCnpj;
  response.locals.formatPhone = formatPhone;
  response.locals.statusLabel = statusLabel;
  response.locals.statusClass = statusClass;
  response.locals.serializeForHtml = serializeForHtml;
  response.locals.sourceLabel = sourceLabel;
  next();
}
