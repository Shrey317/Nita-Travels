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

export interface VehicleFinanceFields {
  purchaseType?: string | null;
  financeBank?: string | null;
  financePolicyNumber?: string | null;
  emiMonthsTotal: number;
  targetEmiCents: number;
}

export function isVehicleFinanced(vehicle: VehicleFinanceFields): boolean {
  const record = vehicle as unknown as Record<string, unknown>;
  const purchaseType = typeof record.purchaseType === "string" ? record.purchaseType : vehicle.purchaseType;
  const financeBank = typeof record.financeBank === "string" ? record.financeBank : vehicle.financeBank;

  if (purchaseType === "Financed") return true;
  if (
    purchaseType === "Cash" &&
    vehicle.emiMonthsTotal === 0 &&
    vehicle.targetEmiCents === 0 &&
    !financeBank
  ) {
    return false;
  }
  return vehicle.emiMonthsTotal > 0 || vehicle.targetEmiCents > 0 || Boolean(financeBank);
}

export function getVehicleFinanceInfo(vehicle: VehicleFinanceFields) {
  const record = vehicle as unknown as Record<string, unknown>;
  const financeBank =
    typeof record.financeBank === "string" && record.financeBank.trim()
      ? record.financeBank.trim()
      : null;
  const financePolicyNumber =
    typeof record.financePolicyNumber === "string" && record.financePolicyNumber.trim()
      ? record.financePolicyNumber.trim()
      : null;
  const financed = isVehicleFinanced(vehicle);
  return {
    purchaseType: financed ? ("Financed" as const) : ("Cash" as const),
    financeBank,
    financePolicyNumber,
    financed,
  };
}

export interface FinanceCountdown {
  totalMonths: number;
  monthsElapsed: number;
  monthsLeft: number;
  balanceCents: number;
  isOwned: boolean;
}

/**
 * Automatically calculates the finance countdown (months elapsed and months remaining until
 * the vehicle is owned by the company) from the purchase date and total finance period.
 */
export function calculateFinanceCountdown(
  purchaseDate: Date,
  totalMonths: number,
  monthlyAmountCents: number = 0,
  referenceDate: Date = new Date()
): FinanceCountdown {
  if (totalMonths <= 0) {
    return {
      totalMonths: 0,
      monthsElapsed: 0,
      monthsLeft: 0,
      balanceCents: 0,
      isOwned: true,
    };
  }

  const yearDiff = referenceDate.getUTCFullYear() - purchaseDate.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - purchaseDate.getUTCMonth();
  const dayAdjustment = referenceDate.getUTCDate() < purchaseDate.getUTCDate() ? -1 : 0;
  const rawElapsed = yearDiff * 12 + monthDiff + dayAdjustment;

  const monthsElapsed = Math.max(0, Math.min(totalMonths, rawElapsed));
  const monthsLeft = Math.max(0, totalMonths - monthsElapsed);
  const balanceCents = monthsLeft * Math.max(0, monthlyAmountCents);

  return {
    totalMonths,
    monthsElapsed,
    monthsLeft,
    balanceCents,
    isOwned: monthsLeft === 0,
  };
}
