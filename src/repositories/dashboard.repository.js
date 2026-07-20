import { getDatabase } from "../config/database.js";

export async function getDashboardMetrics() {
  const database = getDatabase();
  const now = new Date();
  const inThirtyDays = new Date(now);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);

  const [
    totalDocuments,
    activeSuppliers,
    awaitingApproval,
    withDivergence,
    expiringSoon,
    statusDistribution,
    openPurchaseOrders,
  ] = await Promise.all([
    database.collection("documents").countDocuments(),
    database.collection("suppliers").countDocuments({ status: "ACTIVE" }),
    database
      .collection("documents")
      .countDocuments({ status: "AWAITING_APPROVAL" }),
    database
      .collection("documents")
      .countDocuments({ status: "WITH_DIVERGENCE" }),
    database.collection("documents").countDocuments({
      expirationDate: { $gte: now, $lte: inThirtyDays },
      status: { $nin: ["COMPLETED", "REJECTED"] },
    }),
    database
      .collection("documents")
      .aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray(),
    database
      .collection("purchaseOrders")
      .aggregate([
        { $match: { status: { $in: ["OPEN", "PARTIALLY_USED"] } } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            remainingAmount: { $sum: "$remainingAmount" },
          },
        },
      ])
      .toArray(),
  ]);

  return {
    totalDocuments,
    activeSuppliers,
    awaitingApproval,
    withDivergence,
    expiringSoon,
    statusDistribution,
    openPurchaseOrders: openPurchaseOrders[0] || {
      count: 0,
      remainingAmount: 0,
    },
  };
}
