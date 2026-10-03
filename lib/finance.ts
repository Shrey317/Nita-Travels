/**
 * lib/finance.ts
 *
 * Centralized financial calculations. Single source of truth for margin, ROI, and per-km metrics.
 * Ensures safe division (handles zero and nulls) and consistent definitions across the app.
 */

/**
 * Net profit margin as a decimal ratio, e.g. 0.235 for 23.5%.
 * Returns null when income is zero — margin is undefined in that case, not zero.
 * Formula: (Income - Expense) / Income
 */
export function calculateProfitMargin(incomeCents: number, expenseCents: number): number | null {
  if (incomeCents === 0) return null;
  return (incomeCents - expenseCents) / incomeCents;
}

/**
 * Return on Investment (ROI) as a percentage (e.g. 15.5 for 15.5%).
 * Returns null when purchase price is zero to avoid division by zero.
 * Formula: (Net Profit / Purchase Price) * 100
 */
export function calculateRoiPercent(netProfitCents: number, purchasePriceCents: number): number | null {
  if (purchasePriceCents === 0) return null;
  return (netProfitCents / purchasePriceCents) * 100;
}

/**
 * Revenue per Kilometre in cents.
 * Returns null if km driven is zero.
 */
export function calculateRevenuePerKm(incomeCents: number, kmDriven: number): number | null {
  if (kmDriven <= 0) return null;
  return incomeCents / kmDriven;
}

/**
 * Cost per Kilometre in cents.
 * Returns null if km driven is zero.
 */
export function calculateCostPerKm(expenseCents: number, kmDriven: number): number | null {
  if (kmDriven <= 0) return null;
  return expenseCents / kmDriven;
}

/**
 * Profit per Kilometre in cents.
 * Returns null if km driven is zero.
 */
export function calculateProfitPerKm(netProfitCents: number, kmDriven: number): number | null {
  if (kmDriven <= 0) return null;
  return netProfitCents / kmDriven;
}

/** A zero baseline has no defined percentage change; never manufacture 100%. */
export function calculateChange(current: number | null, previous: number | null) {
  if (current === null || previous === null) return { delta: null, percent: null };
  return { delta: current - previous, percent: previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100 };
}

export function financialMetrics(incomeCents: number, expenseCents: number, mileageKm: number) {
  const netProfitCents = incomeCents - expenseCents;
  return { incomeCents, expenseCents, netProfitCents, mileageKm,
    margin: calculateProfitMargin(incomeCents, expenseCents),
    revenuePerKmCents: calculateRevenuePerKm(incomeCents, mileageKm),
    costPerKmCents: calculateCostPerKm(expenseCents, mileageKm),
    profitPerKmCents: calculateProfitPerKm(netProfitCents, mileageKm) };
}
