import { insertAuditLog } from "../repositories/audit-log.repository.js";

export async function registerAudit({
  entityType,
  entityId,
  action,
  description,
  metadata = {},
}) {
  return insertAuditLog({
    entityType,
    entityId,
    action,
    description,
    metadata,
    actor: {
      name: "João Lobo",
      role: "Administrador",
    },
    occurredAt: new Date(),
  });
}
