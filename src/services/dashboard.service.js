import { findRecentAuditLogs } from "../repositories/audit-log.repository.js";
import { getDashboardMetrics } from "../repositories/dashboard.repository.js";
import { findRecentDocuments } from "../repositories/document.repository.js";

export async function getDashboardData() {
  const [metrics, recentDocuments, recentActivity] = await Promise.all([
    getDashboardMetrics(),
    findRecentDocuments(6),
    findRecentAuditLogs(7),
  ]);

  const maxStatusCount = Math.max(
    1,
    ...metrics.statusDistribution.map((item) => item.count),
  );
  const statusDistribution = metrics.statusDistribution.map((item) => ({
    status: item._id,
    count: item.count,
    percentage: Math.round((item.count / maxStatusCount) * 100),
  }));

  return { ...metrics, statusDistribution, recentDocuments, recentActivity };
}
